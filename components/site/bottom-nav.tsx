"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Calendar, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/courses", label: "講座", icon: BookOpen },
  { href: "/book/chat", label: "AI予約", icon: Sparkles },
  { href: "/pricing", label: "プラン", icon: Calendar },
  { href: "/my", label: "マイ", icon: User },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  // Hide on admin pages — they have their own nav
  if (pathname.startsWith("/admin")) return null;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur md:hidden"
      aria-label="モバイルナビゲーション"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="container grid grid-cols-5 gap-1 py-1">
        {ITEMS.map((i) => {
          const active =
            i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium transition",
                  active
                    ? "text-primary"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <i.icon className="h-5 w-5" />
                <span>{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
