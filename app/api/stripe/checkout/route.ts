import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

const VALID_PLANS: PlanId[] = ["free", "starter", "pro", "enterprise"];

export async function POST(req: Request) {
  let plan: PlanId = "free";
  try {
    const formData = await req.formData();
    const requested = String(formData.get("plan") ?? "free");
    if ((VALID_PLANS as string[]).includes(requested)) {
      plan = requested as PlanId;
    }
  } catch {
    // body may already be parsed or empty — fall through with default plan
  }

  const supabase = createClient();
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    user = null;
  }

  // Not logged in? Send to signup with the desired plan as a hint.
  if (!user) {
    const url = new URL(req.url);
    url.pathname = "/signup";
    url.search = `?plan=${plan}`;
    return NextResponse.redirect(url, { status: 303 });
  }

  // Resolve organization
  let orgId: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    orgId = (profile as { organization_id?: string | null } | null)?.organization_id ?? null;
  } catch {
    orgId = null;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const planDef = getPlan(plan);

  // Demo flow when Stripe isn't configured or plan is free / enterprise (contact sales).
  const isDemoFlow = !stripeKey || plan === "free" || plan === "enterprise";

  if (isDemoFlow) {
    // Record a demo subscription state without calling Stripe.
    try {
      if (orgId) {
        await supabase
          .from("subscriptions")
          .upsert(
            {
              organization_id: orgId,
              plan,
              status: plan === "free" ? "active" : "demo_subscription",
            },
            { onConflict: "organization_id" }
          );
        await supabase
          .from("organizations")
          .update({ plan })
          .eq("id", orgId);
        await supabase.from("payments").insert({
          organization_id: orgId,
          amount: planDef.monthlyPrice,
          provider: plan === "free" ? "free" : "demo",
          status: plan === "free" ? "free" : "demo_paid",
        });
      }
    } catch {
      // tables may not exist yet — never break the redirect
    }
    const url = new URL(req.url);
    url.pathname = "/admin/subscription";
    url.search = `?demo=1&plan=${plan}`;
    return NextResponse.redirect(url, { status: 303 });
  }

  // Real Stripe checkout (only when STRIPE_SECRET_KEY is present).
  try {
    const priceId =
      plan === "starter"
        ? process.env.STRIPE_PRICE_STARTER
        : plan === "pro"
          ? process.env.STRIPE_PRICE_PRO
          : null;

    if (!priceId) {
      // Misconfigured – fall back to demo to avoid breaking the UI.
      const url = new URL(req.url);
      url.pathname = "/admin/subscription";
      url.search = `?demo=1&plan=${plan}&reason=missing_price`;
      return NextResponse.redirect(url, { status: 303 });
    }

    const successUrl = new URL(req.url);
    successUrl.pathname = "/admin/subscription";
    successUrl.search = `?status=success&plan=${plan}`;
    const cancelUrl = new URL(req.url);
    cancelUrl.pathname = "/pricing";
    cancelUrl.search = `?status=canceled`;

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", successUrl.toString());
    params.set("cancel_url", cancelUrl.toString());
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    if (orgId) params.set("client_reference_id", orgId);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[stripe checkout] failed:", res.status, text);
      const url = new URL(req.url);
      url.pathname = "/admin/subscription";
      url.search = `?demo=1&plan=${plan}&reason=stripe_error`;
      return NextResponse.redirect(url, { status: 303 });
    }
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      return NextResponse.redirect(data.url, { status: 303 });
    }
  } catch (e) {
    console.warn("[stripe checkout] threw:", e);
  }

  const url = new URL(req.url);
  url.pathname = "/admin/subscription";
  url.search = `?demo=1&plan=${plan}&reason=exception`;
  return NextResponse.redirect(url, { status: 303 });
}
