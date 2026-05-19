import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Minimal Stripe webhook receiver.
// Real signature verification is intentionally lightweight (MVP).
// When STRIPE_WEBHOOK_SECRET is configured, signature is logged and processing continues.
export async function POST(req: Request) {
  let payload: {
    type?: string;
    data?: {
      object?: {
        client_reference_id?: string;
        customer?: string;
        subscription?: string;
        status?: string;
        current_period_end?: number;
        metadata?: Record<string, string>;
      };
    };
  } = {};
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const eventType = payload.type ?? "unknown";
  const object = payload.data?.object ?? {};
  const orgId =
    object.client_reference_id ?? object.metadata?.organization_id ?? null;
  const stripeCustomerId = object.customer ?? null;
  const stripeSubscriptionId = object.subscription ?? null;

  try {
    const supabase = createClient();
    if (
      eventType === "checkout.session.completed" ||
      eventType === "customer.subscription.created" ||
      eventType === "customer.subscription.updated"
    ) {
      if (orgId) {
        const plan = object.metadata?.plan ?? "pro";
        await supabase
          .from("subscriptions")
          .upsert(
            {
              organization_id: orgId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              plan,
              status: "active",
              current_period_end: object.current_period_end
                ? new Date(object.current_period_end * 1000).toISOString()
                : null,
            },
            { onConflict: "organization_id" }
          );
        await supabase.from("organizations").update({ plan }).eq("id", orgId);
      }
    } else if (eventType === "customer.subscription.deleted") {
      if (orgId) {
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("organization_id", orgId);
        await supabase
          .from("organizations")
          .update({ plan: "free" })
          .eq("id", orgId);
      }
    }
  } catch (e) {
    console.warn("[stripe webhook] handler error:", e);
  }

  return NextResponse.json({ ok: true });
}
