import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";

export const dynamic = "force-static";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description:
    "XCloud-Flow の特定商取引法に基づく表記。販売事業者、所在地、支払方法、解約条件などをご案内します。",
  alternates: { canonical: `${SITE_URL}/commercial-disclosure` },
};

export default function CommercialDisclosurePage() {
  return (
    <SiteShell skipAuth>
      <article className="container max-w-3xl py-12 text-sm leading-relaxed text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          特定商取引法に基づく表記
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          特定商取引に関する法律第 11 条に基づき表示しています。
        </p>

        <dl className="mt-8 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[180px_1fr]">
          <Row label="販売事業者">
            運営者情報に記載の事業者
            <span className="ml-2 text-xs text-muted-foreground">
              (詳細は
              <Link href="/contact" className="text-primary underline">
                お問い合わせフォーム
              </Link>
              よりお問い合わせください)
            </span>
          </Row>
          <Row label="運営責任者">運営者情報に記載のとおり</Row>
          <Row label="所在地">請求があった場合に遅滞なく開示します。</Row>
          <Row label="連絡先">
            <Link href="/contact" className="text-primary underline">
              /contact
            </Link>
            （お問い合わせフォーム）。電話番号は請求があった場合に遅滞なく開示します。
          </Row>
          <Row label="販売価格">
            各プランの料金は
            <Link href="/pricing" className="text-primary underline">
              料金プランページ
            </Link>
            に記載しています。表示は税込価格です。
          </Row>
          <Row label="商品代金以外の必要料金">
            インターネット接続料金、通信費はお客様のご負担となります。
          </Row>
          <Row label="支払い方法">クレジットカード決済 (Stripe 経由)</Row>
          <Row label="支払い時期">
            初回ご契約日に決済し、以降は契約更新日にクレジットカードへ自動課金します。
          </Row>
          <Row label="サービス提供時期">
            お申し込み完了後、すぐにご利用いただけます。
          </Row>
          <Row label="返品・キャンセル">
            デジタルサービスの性質上、返品はお受けしておりません。解約は管理画面のサブスクリプションメニューよりいつでも可能です。日割り返金は原則として行いません。
          </Row>
          <Row label="動作環境">
            最新の Google Chrome / Safari / Microsoft Edge / Firefox を推奨します。
          </Row>
        </dl>

        <p className="mt-10 text-xs text-muted-foreground">
          ご不明な点は{" "}
          <Link href="/contact" className="text-primary underline">
            お問い合わせフォーム
          </Link>{" "}
          よりお問い合わせください。
        </p>
      </article>
    </SiteShell>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="border-t py-2 font-medium text-foreground sm:border-t-0 sm:border-r sm:pr-4">
        {label}
      </dt>
      <dd className="border-b py-2 sm:border-b-0 sm:pl-4">{children}</dd>
    </>
  );
}
