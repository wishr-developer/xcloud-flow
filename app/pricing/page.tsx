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
            プランに関するご案内
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              料金はすべて税込価格です。請求はクレジットカードでの月次請求となります。
            </li>
            <li>
              プラン変更はいつでも管理画面の「サブスクリプション」から行えます。
            </li>
            <li>
              現在オンライン決済の準備中の場合がございます。お申し込みは
              <Link href="/contact" className="text-primary underline">
                お問い合わせフォーム
              </Link>
              からご連絡ください。
            </li>
            <li>
              Enterprise プランは
              <Link href="/contact?plan=enterprise" className="text-primary underline">
                お問い合わせ
              </Link>
              より個別にご相談ください。
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            お申し込み前に
            <Link href="/terms" className="underline">利用規約</Link>
            ・
            <Link href="/privacy" className="underline">プライバシーポリシー</Link>
            ・
            <Link href="/commercial-disclosure" className="underline">特定商取引法に基づく表記</Link>
            をご確認ください。
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
