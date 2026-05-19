import { createClient } from "@/lib/supabase/server";

export interface EnrollInput {
  course_id: string;
  customer_name: string;
  customer_email: string;
  payment_method: "onsite" | "stripe" | "demo" | "free";
  coupon_code?: string | null;
  user_id?: string | null;
}

export interface EnrollResult {
  ok: boolean;
  enrollment_id?: string;
  amount_paid?: number;
  payment_status?: "unpaid" | "pending" | "paid" | "demo_paid" | "free";
  redirect_url?: string;
  error?: string;
  needs_checkout?: boolean;
  checkout_amount?: number;
}

export async function createEnrollment(
  input: EnrollInput
): Promise<EnrollResult> {
  const supabase = createClient();
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title, price, sale_price, published")
    .eq("id", input.course_id)
    .maybeSingle();
  if (courseErr || !course) {
    return { ok: false, error: "講座が見つかりません" };
  }
  if (!course.published) {
    return { ok: false, error: "この講座は現在受講できません" };
  }

  let basePrice = course.sale_price ?? course.price ?? 0;

  // Apply coupon if any
  let appliedCoupon: string | null = null;
  if (input.coupon_code) {
    const { data: cp } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", input.coupon_code)
      .eq("active", true)
      .maybeSingle();
    if (!cp) {
      return { ok: false, error: "クーポンコードが無効です" };
    }
    if (cp.expires_at && new Date(cp.expires_at) < new Date()) {
      return { ok: false, error: "クーポンの有効期限が切れています" };
    }
    if (cp.max_uses && cp.used_count >= cp.max_uses) {
      return { ok: false, error: "クーポンの利用上限に達しました" };
    }
    if (cp.discount_type === "percent") {
      basePrice = Math.max(
        0,
        Math.round(basePrice * (1 - cp.discount_value / 100))
      );
    } else {
      basePrice = Math.max(0, basePrice - cp.discount_value);
    }
    appliedCoupon = cp.code;
  }

  const isFree = basePrice === 0;
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const isDemo =
    !isFree &&
    (input.payment_method === "demo" ||
      (input.payment_method === "stripe" && !stripeConfigured));

  const payment_status: EnrollResult["payment_status"] = isFree
    ? "free"
    : isDemo
      ? "demo_paid"
      : input.payment_method === "stripe"
        ? "pending"
        : "unpaid";

  // Check for existing enrollment by email
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", course.id)
    .eq("customer_email", input.customer_email)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "このメールアドレスはすでに登録済みです" };
  }

  const { data: enrollment, error: insErr } = await supabase
    .from("enrollments")
    .insert({
      user_id: input.user_id ?? null,
      course_id: course.id,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      payment_method: isFree ? "free" : isDemo ? "demo" : input.payment_method,
      payment_status,
      amount_paid: isFree ? 0 : isDemo ? basePrice : 0,
      status: "active",
      progress_percent: 0,
      coupon_code: appliedCoupon,
      last_accessed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !enrollment) {
    return { ok: false, error: insErr?.message ?? "登録に失敗しました" };
  }

  if (appliedCoupon) {
    const current = await getCouponCount(appliedCoupon);
    await supabase
      .from("coupons")
      .update({ used_count: current + 1 })
      .eq("code", appliedCoupon);
  }

  return {
    ok: true,
    enrollment_id: enrollment.id,
    amount_paid: isFree ? 0 : isDemo ? basePrice : 0,
    payment_status,
    needs_checkout:
      !isFree && !isDemo && input.payment_method === "stripe",
    checkout_amount: basePrice,
  };
}

async function getCouponCount(code: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("coupons")
    .select("used_count")
    .eq("code", code)
    .maybeSingle();
  return data?.used_count ?? 0;
}
