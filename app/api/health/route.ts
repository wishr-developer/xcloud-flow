import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    supabase: isSupabaseConfigured(),
    supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripe_webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripe_prices:
      !!process.env.STRIPE_PRICE_STARTER && !!process.env.STRIPE_PRICE_PRO,
    resend: !!process.env.RESEND_API_KEY,
    line: !!process.env.LINE_WEBHOOK_URL,
    openai: !!process.env.OPENAI_API_KEY,
    site_url: !!process.env.NEXT_PUBLIC_SITE_URL,
    operator_business_name: !!process.env.NEXT_PUBLIC_LEGAL_BUSINESS_NAME,
    operator_support_email: !!process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  };

  let supabaseReachable = false;
  if (env.supabase) {
    try {
      const supabase = createClient();
      // A cheap read; if the table is missing we still want to report reachable.
      const { error } = await supabase
        .from("organizations")
        .select("id", { head: true, count: "exact" });
      supabaseReachable = !error || error.code !== "PGRST116";
    } catch {
      supabaseReachable = false;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      app: "xcloud-flow",
      version: process.env.npm_package_version ?? "0.1.0",
      env,
      supabase_reachable: supabaseReachable,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
