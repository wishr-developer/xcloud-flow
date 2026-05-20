import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";

export const dynamic = "force-static";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: "利用規約",
  description:
    "XCloud-Flow のご利用にあたっての利用規約。アカウント、料金、解約、禁止事項、免責などをまとめています。",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <SiteShell skipAuth>
      <article className="container max-w-3xl py-12 text-sm leading-relaxed text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          利用規約
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          最終更新日: 2026 年 5 月 20 日
        </p>

        <Section title="第1条 (適用)">
          本規約は、運営者情報に記載の事業者 (以下「当社」) が提供する SaaS
          サービス「XCloud-Flow」(以下「本サービス」) の利用条件を、本サービスを利用する個人または法人 (以下「利用者」)
          との間で定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。
        </Section>

        <Section title="第2条 (アカウント)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              利用者は本サービスを利用するためにアカウント登録を行うものとし、登録情報は最新かつ正確に保つものとします。
            </li>
            <li>
              アカウントに関する管理責任は利用者が負うものとし、不正利用が判明した場合は速やかに当社に通知するものとします。
            </li>
            <li>
              利用者は、同一組織に所属する管理者・スタッフ・講師・受講者などの追加アカウントを発行することができます。
            </li>
          </ol>
        </Section>

        <Section title="第3条 (料金)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              本サービスは
              <Link href="/pricing" className="text-primary underline">
                料金プラン
              </Link>
              に従ってご利用いただけます。
            </li>
            <li>
              有料プランは月額料金 (税込) を毎月クレジットカードにて自動で課金します。
            </li>
            <li>
              料金プランの変更は管理画面のサブスクリプションメニューから随時行えます。
            </li>
          </ol>
        </Section>

        <Section title="第4条 (解約)">
          利用者はいつでも本サービスを解約することができます。解約手続きは管理画面のサブスクリプションメニューから行うことができます。日割り返金は原則として行いません。
        </Section>

        <Section title="第5条 (禁止事項)">
          利用者は、本サービスの利用にあたって以下の行為をしてはなりません。
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>法令または公序良俗に反する行為</li>
            <li>第三者の権利を侵害する行為</li>
            <li>本サービスのリバースエンジニアリング、不正アクセス、過度な負荷をかける行為</li>
            <li>本サービスを通じて違法な商品・役務を販売・提供する行為</li>
            <li>同一の自然人が複数のアカウントを使い分けて不正に利用する行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="第6条 (知的財産権)">
          本サービスに関する一切の知的財産権は当社または正当な権利者に帰属し、利用者が本サービスにアップロードしたデータの権利は利用者に帰属するものとします。
        </Section>

        <Section title="第7条 (サービスの変更・中断)">
          当社は事前の通知なく本サービスの内容を変更、追加、停止することができるものとし、これにより利用者に生じた損害について一切の責任を負いません。
        </Section>

        <Section title="第8条 (免責)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              本サービスは現状有姿で提供されるものとし、当社は本サービスの完全性、有用性、特定目的への適合性を保証しません。
            </li>
            <li>
              当社の故意または重過失による場合を除き、本サービスに関連して利用者に生じた損害について、当社は責任を負いません。
            </li>
          </ol>
        </Section>

        <Section title="第9条 (準拠法・管轄)">
          本規約の準拠法は日本法とし、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄とします。
        </Section>

        <Section title="第10条 (規約の変更)">
          当社は必要に応じて本規約を変更することができます。変更後の規約は本ページに掲載した時点で効力を生じるものとします。
        </Section>

        <p className="mt-10 text-xs text-muted-foreground">
          お問い合わせは{" "}
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
