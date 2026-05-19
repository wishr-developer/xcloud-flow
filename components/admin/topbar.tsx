import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, ExternalLink, Home, Bell } from "lucide-react";

export function AdminTopbar({
  email,
  unreadCount = 0,
}: {
  email: string | null | undefined;
  unreadCount?: number;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b bg-white pl-16 pr-4 md:px-6">
      <div className="truncate text-sm text-muted-foreground">
        ログイン中:{" "}
        <span className="font-medium text-foreground">{email ?? "ゲスト"}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/admin/inbox"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="お知らせ"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/" target="_blank">
            <Home className="mr-1 h-4 w-4" />
            サイト
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/courses" target="_blank">
            <ExternalLink className="mr-1 h-4 w-4" />
            講座を見る
          </Link>
        </Button>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">サインアウト</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
