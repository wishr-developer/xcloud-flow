import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/admin/kpi-card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  Calendar,
  Repeat,
  UserPlus,
  CalendarX,
  CalendarCheck,
  Crown,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface BookingRow {
  id: string;
  total_price: number | null;
  payment_status: string | null;
  attendance_status: string | null;
  status: string | null;
  created_at: string;
  user_id: string | null;
  customer_email: string;
  slot: { lesson?: { id?: string; title?: string } } | null;
}

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = monthStart;

  const monthStartIso = monthStart.toISOString();
  const prevMonthStartIso = prevMonthStart.toISOString();
  const prevMonthEndIso = prevMonthEnd.toISOString();

  // Pull recent bookings — only the columns we need for aggregation.
  const { data: thisMonth } = await supabase
    .from("bookings")
    .select(
      "id,total_price,payment_status,attendance_status,status,created_at,user_id,customer_email,slot:slot_id(lesson:lesson_id(id,title))"
    )
    .gte("created_at", monthStartIso)
    .limit(1000);
  const { data: prevMonth } = await supabase
    .from("bookings")
    .select("id,user_id,customer_email,total_price,payment_status,attendance_status,status,created_at")
    .gte("created_at", prevMonthStartIso)
    .lt("created_at", prevMonthEndIso)
    .limit(1000);

  const rows = ((thisMonth as unknown) as BookingRow[] | null) ?? [];
  const prev = ((prevMonth as unknown) as BookingRow[] | null) ?? [];

  const monthRevenue = rows
    .filter((r) =>
      r.payment_status === "paid" || r.payment_status === "demo_paid"
    )
    .reduce((sum, r) => sum + (r.total_price ?? 0), 0);

  const prevRevenue = prev
    .filter((r) =>
      r.payment_status === "paid" || r.payment_status === "demo_paid"
    )
    .reduce((sum, r) => sum + (r.total_price ?? 0), 0);

  const revenueDelta =
    prevRevenue > 0
      ? Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100)
      : null;

  const totalBookings = rows.length;
  const canceled = rows.filter((r) => r.status === "canceled").length;
  const attended = rows.filter((r) => r.attendance_status === "attended").length;
  const noShow = rows.filter((r) => r.attendance_status === "absent").length;
  const cancelRate =
    totalBookings > 0 ? Math.round((canceled / totalBookings) * 100) : 0;
  const attendanceRate =
    attended + noShow > 0
      ? Math.round((attended / (attended + noShow)) * 100)
      : null;

  // Retention: how many emails appearing this month also appeared in prior month?
  const thisEmails = new Set(rows.map((r) => r.customer_email));
  const prevEmails = new Set(prev.map((r) => r.customer_email));
  const returning = [...thisEmails].filter((e) => prevEmails.has(e)).length;
  const retentionRate =
    prevEmails.size > 0 ? Math.round((returning / prevEmails.size) * 100) : null;

  // New customers this month — emails not in prior month
  const newCustomers = [...thisEmails].filter((e) => !prevEmails.has(e)).length;

  // Top class
  const lessonCount = new Map<string, { title: string; count: number }>();
  for (const r of rows) {
    const lesson = r.slot?.lesson;
    if (!lesson?.id || !lesson.title) continue;
    const cur = lessonCount.get(lesson.id) ?? { title: lesson.title, count: 0 };
    cur.count += 1;
    lessonCount.set(lesson.id, cur);
  }
  const topClasses = [...lessonCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">アナリティクス</h1>
        <p className="text-sm text-muted-foreground">
          月次の売上・継続率・出席率・キャンセル率・新規会員などを表示します。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={Wallet}
          title="今月の売上"
          value={formatCurrency(monthRevenue)}
          hint={
            revenueDelta == null
              ? "前月比較不可"
              : `前月比 ${revenueDelta >= 0 ? "+" : ""}${revenueDelta}%`
          }
          tone={
            revenueDelta == null
              ? "default"
              : revenueDelta >= 0
                ? "success"
                : "warning"
          }
        />
        <KpiCard icon={Calendar} title="今月の予約" value={totalBookings} />
        <KpiCard
          icon={Repeat}
          title="継続率 (前月→今月)"
          value={retentionRate == null ? "—" : retentionRate + "%"}
        />
        <KpiCard
          icon={CalendarCheck}
          title="出席率"
          value={attendanceRate == null ? "—" : attendanceRate + "%"}
        />
        <KpiCard
          icon={CalendarX}
          title="キャンセル率"
          value={cancelRate + "%"}
          tone={cancelRate > 20 ? "warning" : "default"}
        />
        <KpiCard icon={UserPlus} title="新規会員 (推定)" value={newCustomers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-amber-500" /> 人気クラス TOP5
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClasses.length === 0 ? (
              <Empty msg="まだ集計対象のデータがありません。" />
            ) : (
              <ol className="space-y-2 text-sm">
                {topClasses.map((c, i) => (
                  <li
                    key={c.title}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">#{i + 1}</Badge>
                      <span className="font-medium">{c.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.count} 件
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">運用ヒント</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>・出席率は「出席」÷「(出席+欠席)」で算出しています。</p>
            <p>・継続率は前月予約のメールアドレスのうち今月も予約したものの割合です。</p>
            <p>
              ・売上は <code>payment_status</code> が paid / demo_paid の合計です。
            </p>
            <p>
              ・キャンセル率が 20% を超えるとアラートを表示します。リマインドメールの強化が有効です。
            </p>
          </CardContent>
        </Card>
      </div>
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
