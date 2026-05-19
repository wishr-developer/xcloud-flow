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
import { formatDate, formatTime } from "@/lib/utils";
import { ArrowRight, CalendarCheck, GraduationCap, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email ?? "";

  const [enrollmentsRes, bookingsRes, certificatesRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, progress_percent, status, course:course_id(slug,title,subtitle)")
      .or(`user_id.eq.${user.id},customer_email.eq.${email}`)
      .order("last_accessed_at", { ascending: false })
      .limit(4),
    supabase
      .from("bookings")
      .select(
        "id, status, payment_status, attendance_status, slot:slot_id(date,start_time,lesson:lesson_id(title))"
      )
      .or(`user_id.eq.${user.id},customer_email.eq.${email}`)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("certificates")
      .select(
        "id, certificate_number, issued_at, enrollment:enrollment_id(course:course_id(title,slug))"
      )
      .order("issued_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-muted-foreground">受講中の講座</div>
              <div className="mt-1 text-2xl font-bold">
                {enrollmentsRes.data?.length ?? 0}
              </div>
            </div>
            <GraduationCap className="h-7 w-7 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-muted-foreground">予約 (直近)</div>
              <div className="mt-1 text-2xl font-bold">
                {bookingsRes.data?.length ?? 0}
              </div>
            </div>
            <CalendarCheck className="h-7 w-7 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-muted-foreground">取得済み修了証</div>
              <div className="mt-1 text-2xl font-bold">
                {certificatesRes.data?.length ?? 0}
              </div>
            </div>
            <Award className="h-7 w-7 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">受講中の講座</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/my/courses">
              すべて表示 <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {enrollmentsRes.data && enrollmentsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {enrollmentsRes.data.map((e) => {
                const c = e.course as
                  | { slug?: string; title?: string; subtitle?: string }
                  | null;
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{c?.title ?? "-"}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {c?.subtitle ?? ""}
                      </div>
                      <ProgressBar value={e.progress_percent} />
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/courses/${c?.slug}/learn`}>受講する</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty msg="まだ受講中の講座はありません。" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">予約 (直近)</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/my/bookings">
              すべて表示 <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {bookingsRes.data && bookingsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {bookingsRes.data.map((b) => {
                const slot = b.slot as
                  | {
                      date?: string;
                      start_time?: string;
                      lesson?: { title?: string };
                    }
                  | null;
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {slot?.lesson?.title ?? "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slot?.date ? formatDate(slot.date) : ""}{" "}
                        {slot?.start_time ? formatTime(slot.start_time) : ""}
                      </div>
                    </div>
                    <Badge
                      variant={
                        b.status === "confirmed" ? "success" : "destructive"
                      }
                    >
                      {b.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty msg="まだ予約はありません。" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">進捗 {pct}%</div>
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
