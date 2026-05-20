import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  Eye,
  ServerCog,
} from "lucide-react";

export const dynamic = "force-static";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: "セキュリティ",
  description:
    "XCloud-Flow のセキュリティ。テナント分離、認証、暗号化、監査ログ、インフラに関する取り組みをご案内します。",
  alternates: { canonical: `${SITE_URL}/security` },
};

const PILLARS = [
  {
    icon: Database,
    title: "テナント分離",
    desc: "スクールごとに独立した organization 単位でデータを保持し、PostgreSQL の行レベルセキュリティ (RLS) により他テナントのデータが見えない設計です。",
  },
  {
    icon: KeyRound,
    title: "認証",
    desc: "Supabase Auth による安全な認証フロー。管理者・スタッフ・講師・受講者の権限分離をサーバー側で強制します。",
  },
  {
    icon: Lock,
    title: "暗号化",
    desc: "通信はすべて TLS で暗号化。データベース内の機密データもクラウド側で暗号化されて保存されます。",
  },
  {
    icon: Eye,
    title: "監査ログ",
    desc: "予約・課金・組織設定など主要な操作を audit_logs テーブルに記録し、不審な操作を後追いできます。",
  },
  {
    icon: ServerCog,
    title: "インフラ",
    desc: "Next.js / Vercel と Supabase のマネージドサービス上で運用。OS・ミドルウェアのパッチ適用は基盤側で自動化されています。",
  },
  {
    icon: ShieldCheck,
    title: "決済",
    desc: "クレジットカード情報は Stripe を経由して処理され、当社サーバーに保存されません。PCI DSS 準拠の Stripe 側で保管されます。",
  },
];

export default function SecurityPage() {
  return (
    <SiteShell skipAuth>
      <section className="container max-w-5xl py-12">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3 w-3" />
          セキュリティ
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          スクールの大切なデータを安全に
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          XCloud-Flow は、スクール運営に必要な顧客情報・予約情報・売上情報を扱います。
          私たちは安全に運用するため、以下の取り組みを行っています。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <Card key={p.title}>
              <CardContent className="p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{p.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">
            脆弱性のご報告について
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            セキュリティに関する懸念・脆弱性のご報告は{" "}
            <Link href="/contact?topic=security" className="text-primary underline">
              お問い合わせフォーム
            </Link>{" "}
            より「セキュリティ報告」としてご連絡ください。受領後、適切な対応を行ったうえで報告者にフィードバックいたします。
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
