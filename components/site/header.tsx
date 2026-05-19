"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/courses", label: "講座" },
  { href: "/book", label: "予約" },
  { href: "/announcements", label: "お知らせ" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "お問い合わせ" },
];

export function SiteHeader({
  isAuthed = false,
}: {
  isAuthed?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthed ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/my">マイページ</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin">管理画面</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">ログイン</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">無料登録</Link>
              </Button>
            </>
          )}
        </div>

        <button
          aria-label="メニュー"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-white md:hidden">
          <div className="container py-3">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              {isAuthed ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/my">マイページ</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/admin">管理画面</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">ログイン</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/signup">無料登録</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
