import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEnrollment } from "@/lib/enrollment";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !body.course_id ||
    !body.customer_name ||
    !body.customer_email
  ) {
    return NextResponse.json(
      { ok: false, error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createEnrollment({
    course_id: body.course_id,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    coupon_code: body.coupon_code ?? null,
    payment_method: body.payment_method ?? "stripe",
    user_id: user?.id ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  if (result.needs_checkout && process.env.STRIPE_SECRET_KEY) {
    const url = await createStripeCheckout({
      enrollmentId: result.enrollment_id!,
      amount: result.checkout_amount ?? 0,
      customer_email: body.customer_email,
      origin: new URL(request.url).origin,
    });
    if (url) {
      return NextResponse.json({ ...result, redirect_url: url });
    }
  }

  return NextResponse.json(result);
}

async function createStripeCheckout(args: {
  enrollmentId: string;
  amount: number;
  customer_email: string;
  origin: string;
}): Promise<string | null> {
  try {
    const form = new URLSearchParams();
    form.append("mode", "payment");
    form.append("payment_method_types[0]", "card");
    form.append("customer_email", args.customer_email);
    form.append("line_items[0][price_data][currency]", "jpy");
    form.append(
      "line_items[0][price_data][product_data][name]",
      `XCloud-Flow Course ${args.enrollmentId}`
    );
    form.append("line_items[0][price_data][unit_amount]", String(args.amount));
    form.append("line_items[0][quantity]", "1");
    form.append("success_url", `${args.origin}/my/courses?enrolled=${args.enrollmentId}`);
    form.append("cancel_url", `${args.origin}/courses?canceled=1`);
    form.append("metadata[enrollment_id]", args.enrollmentId);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  } catch {
    return null;
  }
}
