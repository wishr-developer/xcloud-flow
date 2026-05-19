import Link from "next/link";
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

export default async function CustomersPage() {
  const supabase = createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("last_booking_at", { ascending: false, nullsFirst: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">顧客 (CRM)</h1>
        <p className="text-sm text-muted-foreground">
          予約のあった顧客が自動で蓄積されます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客一覧 ({customers?.length ?? 0}名)</CardTitle>
        </CardHeader>
        <CardContent>
          {customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>累計予約</TableHead>
                  <TableHead>累計売上</TableHead>
                  <TableHead>最終予約</TableHead>
                  <TableHead>タグ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone ?? "-"}</TableCell>
                    <TableCell>{c.total_bookings}</TableCell>
                    <TableCell>{formatCurrency(c.total_spent ?? 0)}</TableCell>
                    <TableCell>
                      {c.last_booking_at ? formatDate(c.last_booking_at) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).map((t: string) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        詳細
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              まだ顧客はいません。予約が入ると自動で追加されます。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
