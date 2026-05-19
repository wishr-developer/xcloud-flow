import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookListPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: slots } = await supabase
    .from("booking_slots")
    .select(
      "id, date, start_time, end_time, capacity, booked_count, price, status, lesson:lesson_id(title,description,duration_minutes), teacher:teacher_id(name)"
    )
    .gte("date", today)
    .eq("status", "open")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">空き枠を選んで予約</h1>
        <p className="text-sm text-muted-foreground">
          AIチャット形式で予約したい方は{" "}
          <Link href="/book/chat" className="text-primary hover:underline">
            こちら
          </Link>
          。
        </p>
      </div>

      {slots && slots.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((s) => {
            const lesson = s.lesson as
              | { title?: string; description?: string; duration_minutes?: number }
              | null;
            const teacher = s.teacher as { name?: string } | null;
            const remaining = (s.capacity ?? 1) - (s.booked_count ?? 0);
            return (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {lesson?.title ?? "レッスン"}
                    </CardTitle>
                    <Badge variant="success">残{remaining}席</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {lesson?.description && (
                    <p className="text-muted-foreground">{lesson.description}</p>
                  )}
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="font-medium">
                      {s.date} {formatTime(s.start_time)}-{formatTime(s.end_time)}
                    </div>
                    <div className="text-muted-foreground">
                      {teacher?.name ? `講師: ${teacher.name}` : "講師: 未指定"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-bold">
                      {formatCurrency(s.price)}
                    </span>
                    <Button asChild>
                      <Link href={`/book/${s.id}`}>予約する</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            現在、予約可能な枠はありません。
            <br />
            管理画面の「予約枠」から追加してください。
          </CardContent>
        </Card>
      )}
    </div>
  );
}
