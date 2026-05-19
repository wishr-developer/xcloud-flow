import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTime } from "@/lib/utils";
import { BookingForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SlotPage({
  params,
}: {
  params: { slotId: string };
}) {
  const supabase = createClient();
  const { data: slot } = await supabase
    .from("booking_slots")
    .select(
      "id, date, start_time, end_time, capacity, booked_count, price, status, lesson:lesson_id(title,description,duration_minutes), teacher:teacher_id(name,bio)"
    )
    .eq("id", params.slotId)
    .single();

  if (!slot) notFound();

  const lesson = slot.lesson as
    | { title?: string; description?: string; duration_minutes?: number }
    | null;
  const teacher = slot.teacher as { name?: string; bio?: string } | null;
  const remaining = (slot.capacity ?? 1) - (slot.booked_count ?? 0);
  const isAvailable = slot.status === "open" && remaining > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{lesson?.title ?? "レッスン"}</CardTitle>
              <CardDescription className="mt-1">
                {slot.date} {formatTime(slot.start_time)}-{formatTime(slot.end_time)} ·{" "}
                {lesson?.duration_minutes ?? 60}分
              </CardDescription>
            </div>
            <Badge variant={isAvailable ? "success" : "destructive"}>
              {isAvailable ? `残${remaining}席` : "受付終了"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {lesson?.description && (
            <p className="text-muted-foreground">{lesson.description}</p>
          )}
          {teacher && (
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="font-semibold">講師: {teacher.name}</div>
              {teacher.bio && (
                <div className="mt-1 text-muted-foreground">{teacher.bio}</div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between rounded-md border p-4">
            <span className="text-muted-foreground">料金</span>
            <span className="text-2xl font-bold">{formatCurrency(slot.price)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>予約フォーム</CardTitle>
          <CardDescription>お客様情報をご入力ください</CardDescription>
        </CardHeader>
        <CardContent>
          {isAvailable ? (
            <BookingForm slotId={slot.id} price={slot.price ?? 0} />
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              この枠は現在受付できません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
