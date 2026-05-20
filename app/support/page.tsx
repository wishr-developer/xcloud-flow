import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  LifeBuoy,
  Mail,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  ScrollText,
} from "lucide-react";

export const dynamic = "force-static";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: "サポート",
  description:
    "XCloud-Flow のサポート窓口。導入相談・お問い合わせ・FAQ・ヘルプドキュメントへの導線をご案内します。",
  alternates: { canonical: `${SITE_URL}/support` },
};

const RESOURCES = [
  {
    icon: BookOpen,
    title: "よくある質問",
    desc: "プラン、決済、データ分離など、よくお問い合わせいただく内容をまとめています。",
    href: "/faq",
    cta: "FAQ を見る",
  },
  {
    icon: MessageSquare,
    title: "お問い合わせ",
    desc: "プランのご相談、導入支援、機能リクエストなどはこちらから。",
    href: "/contact",
    cta: "問い合わせる",
  },
  {
    icon: ShieldCheck,
    title: "セキュリティ",
    desc: "テナント分離、認証、データ保護に関する取り組みをご案内します。",
    href: "/security",
    cta: "セキュリティ詳細",
  },
  {
    icon: ScrollText,
    title: "ご利用規約",
    desc: "ご利用にあたっての規約、料金、解約条件などを掲載しています。",
    href: "/terms",
    cta: "利用規約を見る",
  },
];

export default function SupportPage() {
  return (
    <SiteShell skipAuth>
      <section className="container max-w-5xl py-12">
        <div className="flex flex-col items-start gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <LifeBuoy className="h-3 w-3" /> サポート
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            導入から運用まで、お気軽にご相談ください
          </h1>
          <p className="text-sm text-muted-foreground">
            業種に応じた設定、最初の予約枠の公開、複数講師・複数拠点の運用設計まで、専任担当がサポートします。
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <Card key={r.title}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{r.title}</div>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
                <div className="mt-auto pt-2">
                  <Link
                    href={r.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {r.cta} →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">
                個別の導入相談
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                複数校舎・複数法人での導入をご検討の方は、専任担当が個別の運用設計をご提案します。お気軽にお問い合わせください。
              </p>
              <Link
                href="/contact?topic=enterprise"
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                個別相談を依頼する →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
