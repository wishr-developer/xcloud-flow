import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/utils";
import { updateCustomerNotes } from "./actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!customer) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, attendance_status, payment_status, total_price, created_at, slot:slot_id(date,start_time,end_time,lesson:lesson_id(title))"
    )
    .eq("customer_email", customer.email)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/customers">← 一覧へ戻る</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>サマリー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="累計予約" value={customer.total_bookings} />
            <Row label="累計売上" value={formatCurrency(customer.total_spent ?? 0)} />
            <Row
              label="最終予約"
              value={
                customer.last_booking_at
                  ? formatDate(customer.last_booking_at)
                  : "-"
              }
            />
            <Row label="電話" value={customer.phone ?? "-"} />
            <div>
              <div className="mb-1 text-muted-foreground">タグ</div>
              <div className="flex flex-wrap gap-1">
                {(customer.tags ?? []).length > 0 ? (
                  customer.tags!.map((t: string) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">なし</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>メモ・タグ編集</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (fd) => {
                "use server";
                await updateCustomerNotes(customer.id, fd);
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="memo">メモ</Label>
                <Textarea
                  id="memo"
                  name="memo"
                  rows={4}
                  defaultValue={customer.memo ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags">タグ (カンマ区切り)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={(customer.tags ?? []).join(", ")}
                />
              </div>
              <Button type="submit">保存</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>予約履歴 ({bookings?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>レッスン</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>出席</TableHead>
                  <TableHead>決済</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>申込日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const slot = b.slot as
                    | {
                        date?: string;
                        start_time?: string;
                        end_time?: string;
                        lesson?: { title?: string };
                      }
                    | null;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        {slot?.date ?? "-"} {slot?.start_time ? formatTime(slot.start_time) : ""}
                      </TableCell>
                      <TableCell>{slot?.lesson?.title ?? "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={b.status === "confirmed" ? "default" : "destructive"}
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b.attendance_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.payment_status === "paid" ||
                            b.payment_status === "demo_paid"
                              ? "success"
                              : "warning"
                          }
                        >
                          {b.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(b.total_price ?? 0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(b.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              予約履歴はありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
