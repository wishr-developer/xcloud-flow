import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

async function markAllRead() {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  try {
    await supabase
      .from("in_app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
  } catch {
    // ignore
  }
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
}

export default async function AdminInboxPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rows: NotifRow[] = [];
  if (user) {
    try {
      const { data } = await supabase
        .from("in_app_notifications")
        .select("id,type,title,body,link,read_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      rows = (data as NotifRow[] | null) ?? [];
    } catch {
      rows = [];
    }
  }
  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">お知らせ</h1>
          <p className="text-sm text-muted-foreground">
            アクティビティ・新規予約・課金イベントを表示します。
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <Button size="sm" variant="outline">
              すべて既読にする ({unread})
            </Button>
          </form>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最新50件</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="お知らせはありません"
              description="新しい予約や通知があるとここに表示されます。"
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {rows.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-md border p-3 ${
                    n.read_at ? "" : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={n.read_at ? "secondary" : "default"}>
                      {n.type}
                    </Badge>
                    <span className="font-medium">{n.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {n.body}
                    </div>
                  )}
                  {n.link && (
                    <Link
                      href={n.link}
                      className="mt-1 inline-block text-xs text-primary hover:underline"
                    >
                      開く →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
