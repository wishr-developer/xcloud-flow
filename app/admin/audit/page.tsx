import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AuditRow {
  id: string;
  category: string;
  action: string;
  actor_email: string | null;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export default async function AdminAuditPage() {
  const supabase = createClient();
  let logs: AuditRow[] = [];
  try {
    const { data } = await supabase
      .from("audit_logs")
      .select("id,category,action,actor_email,target_type,target_id,meta,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    logs = (data as AuditRow[] | null) ?? [];
  } catch {
    logs = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">監査ログ</h1>
        <p className="text-sm text-muted-foreground">
          管理者・予約・組織・課金まわりの最近の操作を表示します。
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近のイベント</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
              まだ監査ログはありません。
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((l) => (
                <li
                  key={l.id}
                  className="rounded-md border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{l.category}</Badge>
                    <span className="font-medium">{l.action}</span>
                    {l.target_type && (
                      <span className="text-xs text-muted-foreground">
                        {l.target_type}
                        {l.target_id ? ` · ${l.target_id.slice(0, 8)}` : ""}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDateTime(l.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {l.actor_email ?? "system"}
                    {l.meta ? ` · ${JSON.stringify(l.meta)}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
