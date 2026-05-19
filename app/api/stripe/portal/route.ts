import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const back = new URL(req.url);
    back.pathname = "/login";
    back.search = "?next=/admin/subscription";
    return NextResponse.redirect(back, { status: 303 });
  }

  let orgId: string | null = null;
  let stripeCustomerId: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    orgId = (profile as { organization_id?: string | null } | null)
      ?.organization_id ?? null;
    if (orgId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("organization_id", orgId)
        .maybeSingle();
      stripeCustomerId = (sub as { stripe_customer_id?: string | null } | null)
        ?.stripe_customer_id ?? null;
    }
  } catch {
    // ignore
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || !stripeCustomerId) {
    // No Stripe key or customer — show a friendly demo redirect.
    const url = new URL(req.url);
    url.pathname = "/admin/subscription";
    url.search = "?portal=unavailable";
    return NextResponse.redirect(url, { status: 303 });
  }

  try {
    const returnUrl = new URL(req.url);
    returnUrl.pathname = "/admin/subscription";
    returnUrl.search = "";

    const form = new URLSearchParams();
    form.set("customer", stripeCustomerId);
    form.set("return_url", returnUrl.toString());

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[stripe portal] failed:", res.status, text);
      const url = new URL(req.url);
      url.pathname = "/admin/subscription";
      url.search = "?portal=error";
      return NextResponse.redirect(url, { status: 303 });
    }
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      return NextResponse.redirect(data.url, { status: 303 });
    }
  } catch (e) {
    console.warn("[stripe portal] threw:", e);
  }

  const url = new URL(req.url);
  url.pathname = "/admin/subscription";
  url.search = "?portal=exception";
  return NextResponse.redirect(url, { status: 303 });
}
