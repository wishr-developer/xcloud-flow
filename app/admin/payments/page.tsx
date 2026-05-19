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
import { KpiCard } from "@/components/admin/kpi-card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Wallet, AlertCircle, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const supabase = createClient();

  const [{ data: payments }, paidSumRes, unpaidCountRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, amount, provider, status, checkout_session_id, created_at, booking:booking_id(customer_name,customer_email)"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("payments")
      .select("amount")
      .in("status", ["paid", "demo_paid"]),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["unpaid", "pending"])
      .eq("status", "confirmed"),
  ]);

  const totalPaid =
    paidSumRes.data?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">決済管理</h1>
        <p className="text-sm text-muted-foreground">
          Stripe / 現地払い / デモ決済の履歴を一覧します。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Wallet}
          title="累計入金"
          value={formatCurrency(totalPaid)}
          tone="success"
        />
        <KpiCard
          icon={AlertCircle}
          title="未払い件数"
          value={unpaidCountRes.count ?? 0}
          tone="warning"
        />
        <KpiCard
          icon={CreditCard}
          title="決済レコード数"
          value={payments?.length ?? 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>決済履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>セッション</TableHead>
                  <TableHead>記録日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const b = p.booking as
                    | { customer_name?: string; customer_email?: string }
                    | null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{b?.customer_name ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {b?.customer_email ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(p.amount ?? 0)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "paid" || p.status === "demo_paid"
                              ? "success"
                              : "warning"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.checkout_session_id ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(p.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              決済履歴はまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
