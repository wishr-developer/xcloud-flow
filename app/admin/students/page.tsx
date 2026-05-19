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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import { setAttendance } from "@/app/admin/bookings/actions";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [todayBookingsRes, allBookingsRes, teachersRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_email, attendance_status, slot:slot_id!inner(date,start_time,end_time,lesson:lesson_id(title),teacher:teacher_id(id,name))"
      )
      .eq("slot.date", today)
      .eq("status", "confirmed")
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_email, attendance_status, slot:slot_id(date,start_time,lesson:lesson_id(title),teacher:teacher_id(name))"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("teachers").select("id,name,email,active").eq("active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">スクール管理</h1>
        <p className="text-sm text-muted-foreground">
          生徒 (受講者) と講師、出席ステータスを管理します。
        </p>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">今日の出席</TabsTrigger>
          <TabsTrigger value="all">全予約 (生徒)</TabsTrigger>
          <TabsTrigger value="teachers">講師</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>本日 ({today}) のレッスン</CardTitle>
            </CardHeader>
            <CardContent>
              {todayBookingsRes.data && todayBookingsRes.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>時刻</TableHead>
                      <TableHead>レッスン</TableHead>
                      <TableHead>講師</TableHead>
                      <TableHead>生徒</TableHead>
                      <TableHead>出席</TableHead>
                      <TableHead className="text-right">出席記録</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayBookingsRes.data.map((b) => {
                      const slot = b.slot as
                        | {
                            start_time?: string;
                            end_time?: string;
                            lesson?: { title?: string };
                            teacher?: { name?: string };
                          }
                        | null;
                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            {slot?.start_time ? formatTime(slot.start_time) : "-"}-
                            {slot?.end_time ? formatTime(slot.end_time) : ""}
                          </TableCell>
                          <TableCell>{slot?.lesson?.title ?? "-"}</TableCell>
                          <TableCell>{slot?.teacher?.name ?? "未指定"}</TableCell>
                          <TableCell>
                            <div className="font-medium">{b.customer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {b.customer_email}
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
                                await setAttendance(b.id, "absent");
                              }}
                            >
                              <Button size="sm" variant="ghost">
                                欠席
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty msg="本日のレッスンはありません。" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>生徒の予約履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {allBookingsRes.data && allBookingsRes.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>生徒</TableHead>
                      <TableHead>レッスン</TableHead>
                      <TableHead>講師</TableHead>
                      <TableHead>日時</TableHead>
                      <TableHead>出席</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookingsRes.data.map((b) => {
                      const slot = b.slot as
                        | {
                            date?: string;
                            start_time?: string;
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
                          </TableCell>
                          <TableCell>{slot?.lesson?.title ?? "-"}</TableCell>
                          <TableCell>{slot?.teacher?.name ?? "未指定"}</TableCell>
                          <TableCell>
                            {slot?.date ? formatDate(slot.date) : "-"}{" "}
                            {slot?.start_time ? formatTime(slot.start_time) : ""}
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty msg="予約履歴がありません。" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>講師一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {teachersRes.data && teachersRes.data.length > 0 ? (
                <ul className="space-y-2">
                  {teachersRes.data.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.email ?? "メール未設定"}
                        </div>
                      </div>
                      <Badge variant="success">在籍</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty msg="講師がいません。" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}
