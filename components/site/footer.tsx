import Link from "next/link";
import { Logo } from "./logo";

const COLS = [
  {
    heading: "学ぶ",
    links: [
      { href: "/courses", label: "オンライン講座" },
      { href: "/book", label: "予約 (対面/オンライン)" },
      { href: "/book/chat", label: "AIチャット予約" },
    ],
  },
  {
    heading: "プラン / サポート",
    links: [
      { href: "/pricing", label: "料金プラン" },
      { href: "/announcements", label: "お知らせ" },
      { href: "/faq", label: "よくある質問" },
      { href: "/contact", label: "お問い合わせ" },
    ],
  },
  {
    heading: "アカウント",
    links: [
      { href: "/login", label: "ログイン" },
      { href: "/signup", label: "無料登録" },
      { href: "/my", label: "マイページ" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-slate-50">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            オンライン学習・予約・決済・顧客管理をひとつに統合したラーニング/業務プラットフォーム。
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
          <span>© {new Date().getFullYear()} XCloud-Flow. All rights reserved.</span>
          <span>Made with Next.js · Supabase · Vercel</span>
        </div>
      </div>
    </footer>
  );
}
