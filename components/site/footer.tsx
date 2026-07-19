import Link from "next/link";
import { Logo } from "./logo";

const COLS = [
  {
    heading: "サービス",
    links: [
      { href: "/courses", label: "オンライン講座" },
      { href: "/book", label: "予約 (対面/オンライン)" },
      { href: "/book/chat", label: "AI チャット予約" },
      { href: "/pricing", label: "料金プラン" },
    ],
  },
  {
    heading: "サポート",
    links: [
      { href: "/support", label: "サポート" },
      { href: "/faq", label: "よくある質問" },
      { href: "/announcements", label: "お知らせ" },
      { href: "/contact", label: "お問い合わせ" },
    ],
  },
  {
    heading: "アカウント",
    links: [
      { href: "/login", label: "ログイン" },
      { href: "/signup", label: "無料ではじめる" },
      { href: "/my", label: "マイページ" },
    ],
  },
  {
    heading: "法務",
    links: [
      { href: "/terms", label: "利用規約" },
      { href: "/privacy", label: "プライバシーポリシー" },
      { href: "/commercial-disclosure", label: "特定商取引法に基づく表記" },
      { href: "/security", label: "セキュリティ" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-slate-50">
      <div className="container grid gap-8 py-12 md:grid-cols-5">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            あらゆるスクール業態のための、予約・受講・決済・通知・顧客管理を統合したクラウド運営プラットフォーム。
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.heading}>
            <div className="text-sm font-semibold text-foreground">
              {c.heading}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link className="hover:text-foreground" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-start justify-between gap-2 py-4 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} XCloud Flow. All rights reserved.</span>
          <span>Made with Next.js · Supabase · Vercel</span>
        </div>
      </div>
    </footer>
  );
}
