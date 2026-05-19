"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function StickyCta({
  href = "/signup",
  label = "無料ではじめる",
  hint = "クレジットカード不要",
}: {
  href?: string;
  label?: string;
  hint?: string;
}) {
  return (
    <div
      className="fixed inset-x-2 bottom-[68px] z-30 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Link
        href={href}
        className="flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 px-4 py-3 text-white shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <div className="leading-tight">
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-[10px] opacity-80">{hint}</div>
          </div>
        </div>
        <span className="text-xs">→</span>
      </Link>
    </div>
  );
}
