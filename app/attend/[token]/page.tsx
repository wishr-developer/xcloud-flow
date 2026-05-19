import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { token: string };
}

interface BookingRow {
  id: string;
  customer_name: string;
  status: string;
  attendance_status: string;
  checked_in_at: string | null;
  organization_id: string | null;
  slot: { date?: string; start_time?: string; lesson?: { title?: string } } | null;
}

export default async function AttendPage({ params }: PageProps) {
  const supabase = createClient();
  let booking: BookingRow | null = null;
  let updated = false;
  let error: string | null = null;

  try {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id,customer_name,status,attendance_status,checked_in_at,organization_id,slot:slot_id(date,start_time,lesson:lesson_id(title))"
      )
      .eq("qr_token", params.token)
      .maybeSingle();
    booking = (data as unknown as BookingRow) ?? null;
  } catch {
    booking = null;
  }

  if (!booking) {
    error = "予約が見つかりません。QRコードを再度確認してください。";
  } else if (booking.status === "canceled") {
    error = "この予約はキャンセルされています。";
  } else if (booking.attendance_status === "attended") {
    // Already attended — nothing to do.
  } else {
    try {
      await supabase
        .from("bookings")
        .update({
          attendance_status: "attended",
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", booking.id);
      updated = true;
      await audit({
        organization_id: booking.organization_id ?? null,
        category: "booking",
        action: "checkin",
        target_type: "bookings",
        target_id: booking.id,
      });
    } catch (e) {
      error = "出席の更新に失敗しました: " + (e as Error).message;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {error ? (
                <>
                  <XCircle className="h-5 w-5 text-rose-500" /> 出席登録できません
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  出席を受け付けました
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : booking ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">{booking.attendance_status === "attended" ? "attended" : "—"}</Badge>
                  <span className="font-medium">{booking.customer_name}</span>
                </div>
                <div className="text-muted-foreground">
                  {booking.slot?.lesson?.title ?? "予約"} ·{" "}
                  {booking.slot?.date ?? ""} {booking.slot?.start_time?.slice(0, 5) ?? ""}
                </div>
                {booking.checked_in_at && (
                  <div className="text-xs text-muted-foreground">
                    チェックイン: {formatDateTime(booking.checked_in_at)}
                  </div>
                )}
                {updated && (
                  <p className="text-xs text-emerald-700">
                    管理画面の出席ステータスを「attended」に更新しました。
                  </p>
                )}
              </>
            ) : null}
            <div className="pt-2">
              <Button asChild variant="outline">
                <Link href="/">ホームへ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
