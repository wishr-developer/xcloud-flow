import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/admin/kpi-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CalendarCheck,
  Users,
  Wallet,
  AlertCircle,
  GraduationCap,
  Inbox,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [
    todayBookingsRes,
    monthBookingsRes,
    customerCountRes,
    unpaidCountRes,
    bookingRevenueRes,
    enrollmentCountRes,
    enrollmentRevenueRes,
    newContactsRes,
    recentBookingsRes,
    recentEnrollmentsRes,
    recentNotificationsRes,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, slot:slot_id!inner(date)", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("slot.date", todayStr),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["unpaid", "pending"])
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("total_price")
      .gte("created_at", monthStart)
      .in("payment_status", ["paid", "demo_paid"]),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    supabase
      .from("enrollments")
      .select("amount_paid")
      .gte("enrolled_at", monthStart)
      .in("payment_status", ["paid", "demo_paid", "free"]),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, status, payment_status, total_price, created_at, slot:slot_id(date,start_time,lesson:lesson_id(title))"
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("enrollments")
      .select(
        "id, customer_name, customer_email, payment_status, amount_paid, enrolled_at, course:course_id(title)"
      )
      .order("enrolled_at", { ascending: false })
      .limit(6),
    supabase
      .from("notification_logs")
      .select("id, type, status, message, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthBookingRev =
    bookingRevenueRes.data?.reduce(
      (sum, b) => sum + (b.total_price ?? 0),
      0
    ) ?? 0;
  const monthEnrollmentRev =
    enrollmentRevenueRes.data?.reduce(
      (sum, e) => sum + (e.amount_paid ?? 0),
      0
    ) ?? 0;
  const monthRevenue = monthBookingRev + monthEnrollmentRev;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">
          講座・予約・決済・サポートをまとめてモニタリングします。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          icon={CalendarCheck}
          title="今日の予約数"
          value={todayBookingsRes.count ?? 0}
        />
        <KpiCard
          icon={Calendar}
          title="今月の予約数"
          value={monthBookingsRes.count ?? 0}
        />
        <KpiCard
          icon={GraduationCap}
          title="累計受講者"
          value={enrollmentCountRes.count ?? 0}
        />
        <KpiCard
          icon={Wallet}
          title="今月の売上"
          value={formatCurrency(monthRevenue)}
          hint={`予約 ${formatCurrency(monthBookingRev)} + 講座 ${formatCurrency(monthEnrollmentRev)}`}
          tone="success"
        />
        <KpiCard
          icon={AlertCircle}
          title="未払い (予約)"
          value={unpaidCountRes.count ?? 0}
          tone={unpaidCountRes.count && unpaidCountRes.count > 0 ? "warning" : "default"}
        />
        <KpiCard
          icon={Users}
          title="顧客数"
          value={customerCountRes.count ?? 0}
        />
        <KpiCard
          icon={Inbox}
          title="未対応の問い合わせ"
          value={newContactsRes.count ?? 0}
          tone={
            newContactsRes.count && newContactsRes.count > 0 ? "warning" : "default"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">直近の予約</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookingsRes.data && recentBookingsRes.data.length > 0 ? (
              <ul className="space-y-2">
                {recentBookingsRes.data.map((b) => {
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
                      <div className="min-w-0">
                        <div className="font-medium">{b.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot?.lesson?.title ?? "レッスン"} · {slot?.date}{" "}
                          {slot?.start_time?.slice(0, 5) ?? ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <span className="text-sm font-semibold">
                          {formatCurrency(b.total_price ?? 0)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty msg="まだ予約はありません。" />
            )}
            <div className="mt-3 text-right">
              <Link
                href="/admin/bookings"
                className="text-sm text-primary hover:underline"
              >
                すべて表示 →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">直近の受講登録</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEnrollmentsRes.data && recentEnrollmentsRes.data.length > 0 ? (
              <ul className="space-y-2">
                {recentEnrollmentsRes.data.map((e) => {
                  const c = e.course as { title?: string } | null;
                  return (
                    <li
                      key={e.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{e.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c?.title ?? "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            e.payment_status === "paid" ||
                            e.payment_status === "demo_paid" ||
                            e.payment_status === "free"
                              ? "success"
                              : "warning"
                          }
                        >
                          {e.payment_status}
                        </Badge>
                        <span className="text-sm font-semibold">
                          {formatCurrency(e.amount_paid ?? 0)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty msg="まだ受講登録はありません。" />
            )}
            <div className="mt-3 text-right">
              <Link
                href="/admin/enrollments"
                className="text-sm text-primary hover:underline"
              >
                すべて表示 →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知ログ (最新)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotificationsRes.data &&
          recentNotificationsRes.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {recentNotificationsRes.data.map((n) => (
                <li key={n.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        n.status === "success"
                          ? "success"
                          : n.status === "skipped"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {n.type} · {n.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                  {n.message && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {n.message}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty msg="通知ログはまだありません。" />
          )}
        </CardContent>
      </Card>
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
