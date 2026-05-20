import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { CheckCircle2, Sparkles, Crown } from "lucide-react";

// Pure marketing page — no DB / cookies needed.
export const dynamic = "force-static";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="border-b bg-gradient-to-b from-sky-50 via-white to-white">
        <div className="container py-16 text-center">
          <Badge variant="secondary" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" />
            XCloud-Flow プラン
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            あらゆるスクール業態のためのSaaSプラン
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            無料からはじめて、必要になったらアップグレード。すべてのプランで業種テンプレートをご利用いただけます。
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={
                "relative flex flex-col " +
                (p.popular
                  ? "border-primary shadow-lg ring-1 ring-primary"
                  : "")
              }
            >
              {p.popular && (
                <Badge className="absolute right-4 top-4">人気</Badge>
              )}
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex items-center gap-2">
                  {p.enterprise ? (
                    <Crown className="h-4 w-4 text-amber-500" />
                  ) : null}
                  <h2 className="text-xl font-bold">{p.name}</h2>
                </div>
                <p className="min-h-[3rem] text-sm text-muted-foreground">
                  {p.tagline}
                </p>
                <div className="my-4">
                  <span className="text-3xl font-bold tracking-tight">
                    {p.monthlyPriceLabel}
                  </span>
                  {p.monthlyPrice > 0 && (
                    <span className="ml-1 text-sm text-muted-foreground">
                      / 月
                    </span>
                  )}
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {p.enterprise ? (
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/contact">{p.cta}</Link>
                    </Button>
                  ) : (
                    <form
                      action={`/api/stripe/checkout`}
                      method="post"
                      className="w-full"
                    >
                      <input type="hidden" name="plan" value={p.id} />
                      <Button
                        type="submit"
                        className="w-full"
                        variant={p.popular ? "default" : "outline"}
                      >
                        {p.cta}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
          <h3 className="mb-2 font-semibold text-slate-900">
            プランに関するご注意
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Stripe が未設定の環境では、ボタンを押すとデモ決済として動作します（実際の請求は発生しません）。
            </li>
            <li>
              プラン変更はいつでも管理画面の「サブスクリプション」から行えます。
            </li>
            <li>
              Enterpriseプランはお問い合わせフォームより個別にご相談ください。
            </li>
          </ul>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
