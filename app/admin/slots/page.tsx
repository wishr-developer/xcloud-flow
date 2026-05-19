import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatTime } from "@/lib/utils";
import { createSlot, deleteSlot, toggleSlotStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function SlotsPage() {
  const supabase = createClient();
  const [{ data: slots }, { data: lessons }, { data: teachers }] =
    await Promise.all([
      supabase
        .from("booking_slots")
        .select(
          "id, date, start_time, end_time, capacity, booked_count, price, status, lesson:lesson_id(title), teacher:teacher_id(name)"
        )
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase.from("lessons").select("id,title,price").eq("active", true),
      supabase.from("teachers").select("id,name").eq("active", true),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">予約枠管理</h1>
        <p className="text-sm text-muted-foreground">
          日付・時刻ごとの予約枠を作成します。受付停止・再開も切替できます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規予約枠を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSlot} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lesson_id">レッスン</Label>
              <select
                id="lesson_id"
                name="lesson_id"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  選択してください
                </option>
                {(lessons ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({formatCurrency(l.price)})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher_id">担当講師</Label>
              <select
                id="teacher_id"
                name="teacher_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">指定なし</option>
                {(teachers ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">日付</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_time">開始</Label>
              <Input id="start_time" name="start_time" type="time" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">終了</Label>
              <Input id="end_time" name="end_time" type="time" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">定員</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">価格</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                defaultValue={3000}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">予約枠を追加</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>予約枠一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {slots && slots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時刻</TableHead>
                  <TableHead>レッスン</TableHead>
                  <TableHead>講師</TableHead>
                  <TableHead>定員 / 予約</TableHead>
                  <TableHead>価格</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((s) => {
                  const lesson = s.lesson as { title?: string } | null;
                  const teacher = s.teacher as { name?: string } | null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>
                        {formatTime(s.start_time)}-{formatTime(s.end_time)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {lesson?.title ?? "-"}
                      </TableCell>
                      <TableCell>{teacher?.name ?? "-"}</TableCell>
                      <TableCell>
                        {s.booked_count} / {s.capacity}
                      </TableCell>
                      <TableCell>{formatCurrency(s.price)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "open"
                              ? "success"
                              : s.status === "full"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <form
                          className="inline"
                          action={async () => {
                            "use server";
                            await toggleSlotStatus(s.id, s.status);
                          }}
                        >
                          <Button type="submit" size="sm" variant="outline">
                            {s.status === "open" ? "停止" : "再開"}
                          </Button>
                        </form>
                        <form
                          className="inline"
                          action={async () => {
                            "use server";
                            await deleteSlot(s.id);
                          }}
                        >
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            削除
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
              予約枠がまだありません。上のフォームから追加してください。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
