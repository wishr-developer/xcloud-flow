import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { booking?: string };
}) {
  const bookingId = searchParams.booking;
  if (!bookingId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          予約情報が見つかりません。
        </CardContent>
      </Card>
    );
  }

  const supabase = createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, customer_name, customer_email, payment_status, payment_method, total_price, qr_token, slot:slot_id(date,start_time,end_time,lesson:lesson_id(title), teacher:teacher_id(name))"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          予約情報が見つかりません。
        </CardContent>
      </Card>
    );
  }

  const slot = booking.slot as
    | {
        date?: string;
        start_time?: string;
        end_time?: string;
        lesson?: { title?: string };
        teacher?: { name?: string };
      }
    | null;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <CardTitle className="mt-2">予約が完了しました</CardTitle>
          <CardDescription>
            確認メール / LINE通知 (設定時) も自動で送信されます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="お名前" value={booking.customer_name} />
          <Row label="メール" value={booking.customer_email} />
          <Row label="レッスン" value={slot?.lesson?.title ?? "-"} />
          <Row
            label="日時"
            value={`${slot?.date ?? "-"} ${
              slot?.start_time ? formatTime(slot.start_time) : ""
            }${slot?.end_time ? `-${formatTime(slot.end_time)}` : ""}`}
          />
          <Row label="講師" value={slot?.teacher?.name ?? "未指定"} />
          <Row label="金額" value={formatCurrency(booking.total_price ?? 0)} />
          <Row
            label="決済"
            value={
              <Badge
                variant={
                  booking.payment_status === "paid" ||
                  booking.payment_status === "demo_paid"
                    ? "success"
                    : "warning"
                }
              >
                {booking.payment_status} ({booking.payment_method})
              </Badge>
            }
          />
          {(booking as { qr_token?: string | null }).qr_token && (
            <div className="space-y-2 border-t pt-4 text-center">
              <div className="text-xs text-muted-foreground">
                当日はこのQRをスタッフに提示してください
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app"}/attend/${(booking as { qr_token?: string }).qr_token}`
                )}`}
                alt="出席QR"
                className="mx-auto h-44 w-44 rounded-md border bg-white p-2"
              />
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link
                    href={`/api/calendar/ics?booking=${booking.id}`}
                    prefetch={false}
                  >
                    .icsを保存
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/api/calendar/google?booking=${booking.id}`} prefetch={false}>
                    Googleカレンダー
                  </Link>
                </Button>
              </div>
            </div>
          )}
          <div className="pt-3 text-center">
            <Button asChild>
              <Link href="/book">他の枠を見る</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
