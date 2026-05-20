import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookingTransaction } from "@/lib/booking";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const FREE_MONTHLY_LIMIT = 10;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anon";
  const allow = rateLimit({ key: `bookings:${ip}`, limit: 20, windowMs: 60_000 });
  if (!allow.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "短時間に多くの予約リクエストを検出しました。しばらく経ってから再度お試しください。",
      },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.slot_id || !body.customer_name || !body.customer_email) {
    return NextResponse.json(
      { ok: false, error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve the organization for this slot so we can check the plan
  let orgId: string | null = null;
  let orgPlan = "free";
  try {
    const { data: slot } = await supabase
      .from("booking_slots")
      .select("organization_id")
      .eq("id", body.slot_id)
      .maybeSingle();
    orgId = (slot as { organization_id?: string | null } | null)
      ?.organization_id ?? null;
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("plan")
        .eq("id", orgId)
        .maybeSingle();
      orgPlan = (org as { plan?: string } | null)?.plan ?? "free";
    }
  } catch {
    orgId = null;
  }

  if (orgPlan === "free" && orgId) {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("created_at", monthStart.toISOString());
      if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Freeプランの月間予約上限 (10件) に達しました。プランをアップグレードしてください: /pricing",
            upgrade_required: true,
          },
          { status: 402 }
        );
      }
    } catch {
      // best effort
    }
  }

  const result = await createBookingTransaction({
    slot_id: body.slot_id,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone ?? null,
    payment_method: body.payment_method ?? "onsite",
    memo: body.memo ?? null,
    participant_note: body.participant_note ?? null,
    source: body.source ?? "web",
    user_id: user?.id ?? null,
  });

  if (result.ok) {
    await audit({
      organization_id: orgId,
      actor_id: user?.id ?? null,
      actor_email: body.customer_email,
      category: "booking",
      action: "create",
      target_type: "bookings",
      target_id: result.booking_id ?? null,
      meta: { source: body.source ?? "web", payment_method: body.payment_method },
    });
    if (orgId) {
      try {
        const { data: owner } = await supabase
          .from("organizations")
          .select("owner_id")
          .eq("id", orgId)
          .maybeSingle();
        const ownerId = (owner as { owner_id?: string | null } | null)?.owner_id ?? null;
        if (ownerId) {
          await supabase.from("in_app_notifications").insert({
            organization_id: orgId,
            user_id: ownerId,
            type: "booking",
            title: `新しい予約: ${body.customer_name}`,
            body: `${body.customer_email} · 支払い: ${body.payment_method ?? "onsite"}`,
            link: `/admin/bookings`,
          });
        }
      } catch {
        // best effort
      }
    }
  }

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  if (body.payment_method === "stripe" && process.env.STRIPE_SECRET_KEY) {
    const checkoutUrl = await createStripeCheckout({
      bookingId: result.booking_id!,
      amount: result.total_price ?? 0,
      customer_email: body.customer_email,
      origin: new URL(request.url).origin,
    });
    if (checkoutUrl) {
      return NextResponse.json({ ...result, redirect_url: checkoutUrl });
    }
  }

  return NextResponse.json(result);
}

async function createStripeCheckout(args: {
  bookingId: string;
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
      `Booking ${args.bookingId}`
    );
    form.append(
      "line_items[0][price_data][unit_amount]",
      String(args.amount)
    );
    form.append("line_items[0][quantity]", "1");
    form.append(
      "success_url",
      `${args.origin}/book/success?booking=${args.bookingId}`
    );
    form.append("cancel_url", `${args.origin}/book?canceled=1`);
    form.append("metadata[booking_id]", args.bookingId);

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
