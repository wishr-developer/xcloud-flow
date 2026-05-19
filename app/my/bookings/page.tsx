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
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, attendance_status, payment_status, total_price, created_at, slot:slot_id(date,start_time,end_time,lesson:lesson_id(title))"
    )
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email ?? ""}`)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">予約履歴</CardTitle>
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
                      <div>{slot?.date ? formatDate(slot.date) : "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {slot?.start_time ? formatTime(slot.start_time) : ""}
                        {slot?.end_time ? `-${formatTime(slot.end_time)}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>{slot?.lesson?.title ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.status === "confirmed" ? "default" : "destructive"
                        }
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            予約履歴はまだありません。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
