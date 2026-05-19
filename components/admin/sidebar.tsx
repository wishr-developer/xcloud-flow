"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/logo";
import {
  LayoutDashboard,
  CalendarRange,
  BookOpen,
  GraduationCap,
  Users,
  UserCog,
  CreditCard,
  Bell,
  Settings,
  PlayCircle,
  Megaphone,
  HelpCircle,
  Ticket,
  Inbox,
  Menu,
  X,
} from "lucide-react";

const SECTIONS = [
  {
    heading: "ダッシュボード",
    items: [
      { href: "/admin", label: "ホーム", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "アナリティクス", icon: LayoutDashboard },
      { href: "/admin/audit", label: "監査ログ", icon: LayoutDashboard },
    ],
  },
  {
    heading: "e-ラーニング",
    items: [
      { href: "/admin/courses", label: "講座", icon: PlayCircle },
      { href: "/admin/enrollments", label: "受講者", icon: GraduationCap },
    ],
  },
  {
    heading: "予約 / スクール",
    items: [
      { href: "/admin/bookings", label: "予約", icon: CalendarRange },
      { href: "/admin/slots", label: "予約枠", icon: CalendarRange },
      { href: "/admin/lessons", label: "レッスン", icon: BookOpen },
      { href: "/admin/teachers", label: "講師", icon: UserCog },
      { href: "/admin/students", label: "出席管理", icon: GraduationCap },
    ],
  },
  {
    heading: "顧客 / 決済",
    items: [
      { href: "/admin/customers", label: "顧客 (CRM)", icon: Users },
      { href: "/admin/payments", label: "決済", icon: CreditCard },
      { href: "/admin/notifications", label: "通知ログ", icon: Bell },
    ],
  },
  {
    heading: "マーケティング",
    items: [
      { href: "/admin/announcements", label: "お知らせ", icon: Megaphone },
      { href: "/admin/faqs", label: "FAQ", icon: HelpCircle },
      { href: "/admin/coupons", label: "クーポン", icon: Ticket },
      { href: "/admin/contacts", label: "問い合わせ", icon: Inbox },
    ],
  },
  {
    heading: "システム",
    items: [
      { href: "/admin/site-config", label: "サイト設定 (業種)", icon: Settings },
      { href: "/admin/subscription", label: "サブスクリプション", icon: CreditCard },
      { href: "/admin/settings", label: "通知 / 決済設定", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navContent = (
    <nav className="flex-1 space-y-4 overflow-y-auto p-3">
      {SECTIONS.map((s) => (
        <div key={s.heading}>
          <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {s.heading}
          </div>
          <ul className="space-y-1">
            {s.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white shadow md:hidden"
        aria-label="メニュー"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Logo size="sm" />
        </div>
        {navContent}
        <div className="border-t p-3 text-xs text-muted-foreground">
          XCloud-Flow · 管理画面
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center border-b px-5">
              <Logo size="sm" />
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
