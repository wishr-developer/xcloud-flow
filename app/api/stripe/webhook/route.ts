import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StripeEvent {
  id?: string;
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
}

/**
 * Verify a Stripe webhook signature.
 * Stripe sends `Stripe-Signature: t=<ts>,v1=<sig>[,v1=<sig>...]` where
 * `<sig>` is HMAC-SHA256(secret, `${ts}.${rawBody}`).
 */
function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((s) => {
      const i = s.indexOf("=");
      return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    })
  );
  const ts = parts.t;
  if (!ts) return false;
  // Reject events older than tolerance (replay protection).
  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) return false;
  const skew = Math.abs(Date.now() / 1000 - tsNumber);
  if (skew > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`)
    .digest("hex");

  // Stripe may send multiple v1 signatures (key rotation) — accept any match.
  const candidates = header
    .split(",")
    .filter((s) => s.trim().startsWith("v1="))
    .map((s) => s.split("=")[1]?.trim() ?? "");

  for (const sig of candidates) {
    if (sig.length !== expected.length) continue;
    try {
      if (timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return true;
      }
    } catch {
      // length mismatch — skip
    }
  }
  return false;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  // If a secret is configured, **require** a valid signature. Reject on failure.
  if (secret) {
    const ok = verifyStripeSignature(
      rawBody,
      req.headers.get("stripe-signature"),
      secret
    );
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "invalid signature" },
        { status: 400 }
      );
    }
  }

  let payload: StripeEvent = {};
  try {
    payload = JSON.parse(rawBody) as StripeEvent;
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
        await audit({
          organization_id: orgId,
          category: "subscription",
          action: eventType,
          target_type: "subscriptions",
          meta: { stripe_event_id: payload.id ?? null, plan },
        });
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
        await audit({
          organization_id: orgId,
          category: "subscription",
          action: eventType,
          target_type: "subscriptions",
          meta: { stripe_event_id: payload.id ?? null },
        });
      }
    }
  } catch (e) {
    console.warn("[stripe webhook] handler error:", (e as Error).message);
  }

  return NextResponse.json({ ok: true });
}
