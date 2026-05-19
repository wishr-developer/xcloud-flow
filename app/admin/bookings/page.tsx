import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/utils";
import { cancelBooking, setAttendance, setPaymentStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function BookingsAdminPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, customer_name, customer_email, customer_phone, status, attendance_status, payment_status, payment_method, total_price, memo, created_at, slot:slot_id(date,start_time,end_time,lesson:lesson_id(title), teacher:teacher_id(name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">予約一覧</h1>
        <p className="text-sm text-muted-foreground">
          全予約の状況を一覧します。出席・決済ステータスやキャンセル操作はここから。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>予約 ({bookings?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客</TableHead>
                  <TableHead>レッスン</TableHead>
                  <TableHead>予約日時</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>決済</TableHead>
                  <TableHead>出席</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>申込日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
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
                        teacher?: { name?: string };
                      }
                    | null;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="font-medium">{b.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {b.customer_email}
                        </div>
                        {b.customer_phone && (
                          <div className="text-xs text-muted-foreground">
                            {b.customer_phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{slot?.lesson?.title ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          講師: {slot?.teacher?.name ?? "未指定"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{slot?.date ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot?.start_time ? formatTime(slot.start_time) : ""}
                          {slot?.end_time ? `-${formatTime(slot.end_time)}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(b.total_price ?? 0)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
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
                          <div className="text-xs text-muted-foreground">
                            {b.payment_method}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.attendance_status === "attended"
                              ? "success"
                              : b.attendance_status === "absent"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {b.attendance_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === "confirmed" ? "default" : "destructive"
                          }
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(b.created_at)}
                      </TableCell>
                      <TableCell className="space-x-1 text-right">
                        <form
                          className="inline"
                          action={async () => {
                            "use server";
                            await setAttendance(b.id, "attended");
                          }}
                        >
                          <Button size="sm" variant="outline">
                            出席
                          </Button>
                        </form>
                        <form
                          className="inline"
                          action={async () => {
                            "use server";
                            await setPaymentStatus(b.id, "paid");
                          }}
                        >
                          <Button size="sm" variant="outline">
                            入金済
                          </Button>
                        </form>
                        <form
                          className="inline"
                          action={async () => {
                            "use server";
                            await cancelBooking(b.id);
                          }}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            取消
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              予約はまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
