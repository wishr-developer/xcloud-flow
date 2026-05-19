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
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEnrollmentsPage() {
  const supabase = createClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, customer_name, customer_email, status, payment_status, payment_method, amount_paid, progress_percent, enrolled_at, completed_at, course:course_id(title,slug)"
    )
    .order("enrolled_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">受講者管理</h1>
        <p className="text-sm text-muted-foreground">
          各講座の受講者と進捗・支払い状況を確認できます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>受講者 ({enrollments?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments && enrollments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>受講者</TableHead>
                  <TableHead>講座</TableHead>
                  <TableHead>進捗</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>決済</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => {
                  const c = e.course as { title?: string; slug?: string } | null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.customer_email}
                        </div>
                      </TableCell>
                      <TableCell>{c?.title ?? "-"}</TableCell>
                      <TableCell>
                        <div className="h-1.5 w-24 rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.min(100, e.progress_percent)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {e.progress_percent}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.status === "completed"
                              ? "success"
                              : e.status === "canceled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.payment_status === "paid" ||
                            e.payment_status === "demo_paid" ||
                            e.payment_status === "free"
                              ? "success"
                              : "warning"
                          }
                        >
                          {e.payment_status} ({e.payment_method})
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(e.amount_paid ?? 0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(e.enrolled_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              まだ受講者はいません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
