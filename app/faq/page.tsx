import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { createClient } from "@/lib/supabase/server";

// ISR: FAQs rarely change.
export const revalidate = 600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: "よくある質問",
  description:
    "XCloud-Flow のよくある質問。対応業種、料金、複数講師・複数拠点・決済・データ分離・解約・導入支援などをまとめています。",
  alternates: { canonical: `${SITE_URL}/faq` },
};

// Sales-ready FAQ baked into the page so the marketing surface never appears
// empty before an org adds its own FAQs.
const DEFAULT_FAQ = [
  {
    category: "ご利用全般",
    items: [
      {
        q: "どんな業種に対応していますか？",
        a: "学習塾・スポーツ・料理・音楽・語学・ダンス・ヨガ・フィットネス・アート・ビジネス研修・資格スクール・子ども向け教室など、あらゆるスクール業態に対応しています。業種テンプレートをワンクリックで切り替えると、UI の呼称や予約導線も合わせて切り替わります。",
      },
      {
        q: "無料で使えますか？",
        a: "はい。Free プランでは月10件までの予約管理と業種テンプレートの切り替えが無料でご利用いただけます。クレジットカードのご登録は不要です。",
      },
      {
        q: "有料プランでは何ができますか？",
        a: "Starter プランでは予約・受講管理が無制限となり、顧客 (CRM) 管理・通知ログ・クーポン発行などをご利用いただけます。Pro プランでは AI チャット予約、Stripe オンライン決済、LINE 通知、複数講師、KPI ダッシュボード、修了証発行などをご利用いただけます。",
      },
    ],
  },
  {
    category: "運用",
    items: [
      {
        q: "予約ページは公開できますか？",
        a: "はい。サインアップ直後に /x/{あなたのスラッグ} という公開予約ページが発行されます。ブランドカラー・ロゴ・タグラインを設定して、お客様にすぐご案内いただけます。",
      },
      {
        q: "複数講師に対応していますか？",
        a: "はい。講師ごとに担当クラスや予約枠を割り当てられます。Pro プラン以上では複数講師の予約導線、担当別 KPI ダッシュボードがご利用いただけます。",
      },
      {
        q: "複数拠点に対応していますか？",
        a: "はい。Enterprise プランでは複数拠点・フランチャイズ運営に対応しています。拠点ごとに住所・電話番号・タイムゾーンを設定でき、予約枠も拠点に紐付けて管理できます。",
      },
      {
        q: "AI 予約とは何ですか？",
        a: "受講希望者が「土曜の朝のヨガを予約したい」のように自然文で書くだけで、空き枠を提案して予約まで導線するチャット型の予約体験です。業種に応じた会話導線を自動で組み立てます。",
      },
    ],
  },
  {
    category: "決済・通知",
    items: [
      {
        q: "決済は使えますか？",
        a: "はい。Stripe を通じたクレジットカード決済に対応しています。月謝・単発レッスン費・物販まで、ひとつの管理画面でご利用いただけます。決済の有効化は管理画面のサブスクリプションメニューより設定いただけます。",
      },
      {
        q: "LINE 通知は使えますか？",
        a: "はい。Pro プラン以上で LINE Webhook と連携でき、新規予約・キャンセル・リマインドを LINE で自動通知できます。",
      },
    ],
  },
  {
    category: "セキュリティ・契約",
    items: [
      {
        q: "データは他のスクールから見えませんか？",
        a: "見えません。スクールごとに独立した organization 単位でデータを保持し、PostgreSQL の行レベルセキュリティ (RLS) により他テナントのデータへのアクセスは原則として遮断されます。詳細は /security をご参照ください。",
      },
      {
        q: "解約はできますか？",
        a: "はい。管理画面のサブスクリプションメニューよりいつでも解約いただけます。日割り返金は原則として行いません。詳しくは /terms および /commercial-disclosure をご確認ください。",
      },
      {
        q: "導入サポートはありますか？",
        a: "はい。導入時の業種テンプレート選定、最初の予約枠の公開、複数講師・複数拠点運用の設計などをサポートしています。/support よりお気軽にご相談ください。",
      },
    ],
  },
];

interface FaqRow {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  order_index: number;
}

export default async function FaqPage() {
  let orgFaqs: FaqRow[] = [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("faqs")
      .select("id,category,question,answer,order_index")
      .eq("published", true)
      .order("category", { ascending: true })
      .order("order_index", { ascending: true });
    orgFaqs = (data as FaqRow[] | null) ?? [];
  } catch {
    orgFaqs = [];
  }

  const orgGrouped: Record<string, FaqRow[]> = {};
  orgFaqs.forEach((f) => {
    const cat = f.category ?? "その他";
    (orgGrouped[cat] = orgGrouped[cat] ?? []).push(f);
  });

  // Structured data (FAQPage)
  const ldItems = DEFAULT_FAQ.flatMap((g) => g.items).map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: i.a,
    },
  }));
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ldItems,
  };

  return (
    <SiteShell skipAuth>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">よくある質問</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          XCloud-Flow のご利用にあたってよくお問い合わせいただく内容をまとめました。
        </p>

        <div className="mt-8 space-y-8">
          {DEFAULT_FAQ.map((g) => (
            <section key={g.category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {g.category}
              </h2>
              <div className="space-y-2">
                {g.items.map((i) => (
                  <details
                    key={i.q}
                    className="group rounded-md border bg-white p-4"
                  >
                    <summary className="cursor-pointer list-none text-base font-medium">
                      <span className="mr-2 text-primary">Q.</span>
                      {i.q}
                    </summary>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      <span className="mr-2 font-semibold text-foreground">
                        A.
                      </span>
                      {i.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {Object.entries(orgGrouped).map(([cat, list]) => (
            <section key={`org-${cat}`}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </h2>
              <div className="space-y-2">
                {list.map((f) => (
                  <details
                    key={f.id}
                    className="group rounded-md border bg-white p-4"
                  >
                    <summary className="cursor-pointer list-none text-base font-medium">
                      <span className="mr-2 text-primary">Q.</span>
                      {f.question}
                    </summary>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      <span className="mr-2 font-semibold text-foreground">
                        A.
                      </span>
                      {f.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-md border bg-slate-50 p-4 text-xs text-muted-foreground">
          解決しない場合は{" "}
          <Link href="/contact" className="text-primary underline">
            お問い合わせフォーム
          </Link>{" "}
          までご連絡ください。
        </div>
      </div>
    </SiteShell>
  );
}
