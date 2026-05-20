import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";

export const dynamic = "force-static";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "XCloud-Flow のプライバシーポリシー。取得情報・利用目的・第三者提供・外部サービスの取り扱いについてご案内します。",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <SiteShell skipAuth>
      <article className="container max-w-3xl py-12 text-sm leading-relaxed text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          プライバシーポリシー
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          最終更新日: 2026 年 5 月 20 日
        </p>

        <Section title="1. 取得する情報">
          運営者情報に記載の事業者 (以下「当社」) は、本サービスの提供にあたり以下の情報を取得します。
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>氏名、メールアドレス、電話番号、所属組織名</li>
            <li>サービス上で利用者が登録するスクール情報・予約情報・顧客情報</li>
            <li>決済代行サービスを通じて発生する支払情報 (カード情報は当社が直接保持しません)</li>
            <li>アクセスログ、Cookie、IP アドレス、ブラウザ種別等の利用状況に関する情報</li>
          </ul>
        </Section>

        <Section title="2. 利用目的">
          <ul className="list-disc space-y-1 pl-5">
            <li>本サービスの提供、運用、改善、新機能の開発</li>
            <li>利用者の本人確認、認証、不正利用の防止</li>
            <li>料金の請求、決済の処理、サポートの提供</li>
            <li>サービスに関するお知らせ、メンテナンス情報の通知</li>
            <li>統計データの作成 (個人を特定しない形式)</li>
          </ul>
        </Section>

        <Section title="3. 第三者提供">
          法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。ただし、業務委託先 (決済代行・クラウドインフラ・メール送信等) に対し、利用目的の範囲内で必要な情報を提供することがあります。
        </Section>

        <Section title="4. 外部サービス">
          本サービスは以下の外部サービスを利用しており、必要に応じてそれぞれのプライバシーポリシーが適用されます。
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>クラウドインフラ: Vercel, Supabase</li>
            <li>決済代行: Stripe</li>
            <li>通知連携 (任意): LINE Webhook</li>
            <li>AI アシスタント (任意): OpenAI</li>
          </ul>
        </Section>

        <Section title="5. Cookie / アクセス解析">
          ログイン状態の維持、利用状況の把握、サービスの品質向上を目的として Cookie を利用します。Cookie はブラウザの設定により無効化できますが、本サービスの一部機能が利用できなくなる場合があります。
        </Section>

        <Section title="6. 開示・訂正・削除">
          利用者は、当社の保有する自身の個人情報の開示、訂正、削除を求めることができます。お問い合わせは
          <Link href="/contact" className="text-primary underline">
            お問い合わせフォーム
          </Link>
          よりお願いいたします。
        </Section>

        <Section title="7. 保管期間">
          個人情報は利用目的の達成に必要な期間のみ保管し、不要となった場合は速やかに削除または匿名化します。
        </Section>

        <Section title="8. 改定">
          本ポリシーは法令の改正、業務の変更に応じて改定することがあります。改定後の内容は本ページに掲載した時点で効力を生じます。
        </Section>

        <p className="mt-10 text-xs text-muted-foreground">
          本ポリシーに関するお問い合わせは{" "}
          <Link href="/contact" className="text-primary underline">
            お問い合わせフォーム
          </Link>{" "}
          よりお願いいたします。
        </p>
      </article>
    </SiteShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
