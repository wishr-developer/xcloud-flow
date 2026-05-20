import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getBusinessTemplate,
  listBusinessTemplates,
} from "@/lib/business-templates";
import type { BusinessType } from "@/lib/types";
import {
  Calendar,
  MessageSquare,
  CreditCard,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-static";

interface PageProps {
  params: { slug: string };
}

const SLUG_TO_TYPE: Record<string, BusinessType> = {
  sports: "sports",
  yoga: "yoga",
  music: "music",
  cooking: "cooking",
  dance: "dance",
  fitness: "fitness",
  art: "art",
  language: "language",
  learning: "learning",
  business: "business",
};

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_TYPE).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const type = SLUG_TO_TYPE[params.slug];
  if (!type) return { title: "Not Found" };
  const t = getBusinessTemplate(type);
  const title = `${t.displayName}向けスクール運営SaaS — XCloud-Flow`;
  const description = t.heroCopy;
  const ogImage = `https://xcloud-flow.vercel.app/og-${params.slug}.png`;
  return {
    title,
    description,
    alternates: { canonical: `https://xcloud-flow.vercel.app/industries/${params.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://xcloud-flow.vercel.app/industries/${params.slug}`,
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

const FEATURES = [
  { icon: Calendar, title: "予約・出席管理", desc: "対面/オンライン/ハイブリッド対応" },
  { icon: MessageSquare, title: "AIチャット予約", desc: "業種に応じた会話導線" },
  { icon: CreditCard, title: "Stripe決済 / 月謝", desc: "オンラインカード決済と月謝徴収に対応" },
  { icon: Users, title: "顧客 (CRM)", desc: "会員プロファイル・履歴管理" },
];

export default function IndustryLandingPage({ params }: PageProps) {
  const type = SLUG_TO_TYPE[params.slug];
  if (!type) notFound();
  const t = getBusinessTemplate(type);
  const others = listBusinessTemplates()
    .filter((x) => x.id !== type && Object.values(SLUG_TO_TYPE).includes(x.id))
    .slice(0, 6);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `XCloud-Flow — ${t.displayName}`,
    description: t.heroCopy,
    brand: { "@type": "Brand", name: "XCloud-Flow" },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
      url: "https://xcloud-flow.vercel.app/pricing",
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <section className="border-b bg-gradient-to-b from-sky-50 via-white to-white">
        <div className="container py-16 md:py-20">
          <Badge variant="secondary">{t.displayName}</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {t.displayName}のための予約・受講管理SaaS
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t.heroCopy}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                無料ではじめる <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/book/chat">AIチャット予約を試す</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          {t.displayName}に必要な機能、すべて標準搭載
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="space-y-2 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-slate-50/60">
        <div className="container py-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            こんなご相談に最適です
          </h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {t.examplePrompts.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-12">
        <h2 className="mb-6 text-xl font-bold tracking-tight">他の業種も対応</h2>
        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-6">
          {others.map((o) => (
            <Link
              key={o.id}
              href={`/industries/${o.id}`}
              className="rounded-md border bg-white px-3 py-2 text-center text-xs hover:bg-slate-50"
            >
              {o.displayName}
            </Link>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 px-8 py-12 text-white shadow-xl">
          <h2 className="text-2xl font-bold">今日から{t.displayName}運営をDX。</h2>
          <p className="mt-2 text-sm text-white/80">
            無料プランから始められ、業種テンプレートをワンクリックで適用できます。Stripe / LINE / AI連携は必要に応じて有効化してください。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">無料ではじめる</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/pricing">プランを見る</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
