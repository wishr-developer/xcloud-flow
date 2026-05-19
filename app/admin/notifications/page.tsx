import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("notification_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">通知ログ</h1>
        <p className="text-sm text-muted-foreground">
          LINE / メール / システム通知の送信状況を確認できます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>送信履歴 ({logs?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種別</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>メッセージ</TableHead>
                  <TableHead>日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Badge variant="secondary">{l.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "success"
                            ? "success"
                            : l.status === "skipped"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-2xl truncate">
                      {l.message ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(l.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              通知ログはまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
