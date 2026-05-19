import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { PLANS, getPlan } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { demo?: string; plan?: string; status?: string; reason?: string };
}

export default async function AdminSubscriptionPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orgId: string | null = null;
  let plan: PlanId = "free";
  let subscriptionStatus = "active";
  let currentPeriodEnd: string | null = null;
  let stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

  if (user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      orgId = (profile as { organization_id?: string | null } | null)
        ?.organization_id ?? null;
    } catch {
      orgId = null;
    }
    if (orgId) {
      try {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan,status,current_period_end")
          .eq("organization_id", orgId)
          .maybeSingle();
        if (sub) {
          plan = (sub as { plan: PlanId }).plan ?? "free";
          subscriptionStatus = (sub as { status: string }).status ?? "active";
          currentPeriodEnd =
            (sub as { current_period_end: string | null }).current_period_end ?? null;
        }
        const { data: org } = await supabase
          .from("organizations")
          .select("plan")
          .eq("id", orgId)
          .maybeSingle();
        const orgPlan = (org as { plan?: PlanId } | null)?.plan;
        if (orgPlan) plan = orgPlan;
      } catch {
        // ignore — fall back to defaults
      }
    }
  }

  const currentPlan = getPlan(plan);

  const banner = searchParams?.demo === "1" ? (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Stripe が未設定または対象プラン未設定のため、{currentPlan.name} プランをデモモードで適用しました。
      本番運用時は <code>STRIPE_SECRET_KEY</code> と{" "}
      <code>STRIPE_PRICE_*</code> を Vercel に設定してください。
    </div>
  ) : searchParams?.status === "success" ? (
    <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      Stripe決済が完了しました。プランを更新しました。
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">サブスクリプション</h1>
        <p className="text-sm text-muted-foreground">
          現在のご契約プランを確認・変更できます。
        </p>
      </div>

      {banner}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            現在のプラン
            <Badge variant={plan === "free" ? "secondary" : "default"}>
              {currentPlan.name}
            </Badge>
            {subscriptionStatus === "demo_subscription" && (
              <Badge variant="warning">デモ</Badge>
            )}
          </CardTitle>
          <CardDescription>{currentPlan.tagline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            月額: <span className="font-semibold">{currentPlan.monthlyPriceLabel}</span>
          </div>
          <div>状態: {subscriptionStatus}</div>
          {currentPeriodEnd && (
            <div>次回更新: {new Date(currentPeriodEnd).toLocaleString("ja-JP")}</div>
          )}
          <div className="text-xs text-muted-foreground">
            Stripe接続: {stripeConfigured ? "✅ 本番モード" : "未設定 (デモ動作)"}
          </div>
          <form action="/api/stripe/portal" method="post" className="pt-2">
            <Button type="submit" size="sm" variant="outline">
              請求ポータルを開く
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>プラン変更</CardTitle>
          <CardDescription>
            アップグレード / ダウングレードは下記から。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => {
              const active = p.id === plan;
              return (
                <Card key={p.id} className={active ? "border-primary" : ""}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      {active && <Badge variant="secondary">利用中</Badge>}
                      {p.popular && <Badge>人気</Badge>}
                    </div>
                    <div className="text-2xl font-bold">{p.monthlyPriceLabel}</div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {p.highlights.slice(0, 4).map((h) => (
                        <li key={h}>・{h}</li>
                      ))}
                    </ul>
                    {p.enterprise ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/contact">問い合わせる</Link>
                      </Button>
                    ) : active ? (
                      <Button variant="outline" size="sm" disabled>
                        現在のプラン
                      </Button>
                    ) : (
                      <form action="/api/stripe/checkout" method="post">
                        <input type="hidden" name="plan" value={p.id} />
                        <Button type="submit" size="sm" className="w-full">
                          {p.id === "free" ? "ダウングレード" : "アップグレード"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            ※ プラン詳細は <Link href="/pricing" className="text-primary underline">/pricing</Link> もご覧ください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
