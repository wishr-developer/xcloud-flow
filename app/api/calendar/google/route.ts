import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function toGoogleDate(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  const [hh, mm] = time.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookingId = url.searchParams.get("booking");
  if (!bookingId) {
    return NextResponse.json({ ok: false, error: "missing booking" }, { status: 400 });
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id,customer_name,slot:slot_id(date,start_time,end_time,location,online_url,lesson:lesson_id(title))"
    )
    .eq("id", bookingId)
    .maybeSingle();
  const booking = data as
    | {
        id: string;
        customer_name: string;
        slot: {
          date?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          online_url?: string | null;
          lesson?: { title?: string };
        } | null;
      }
    | null;
  if (!booking?.slot?.date || !booking.slot.start_time || !booking.slot.end_time) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }
  const title = booking.slot.lesson?.title ?? "予約";
  const location = booking.slot.location ?? booking.slot.online_url ?? "";
  const start = toGoogleDate(booking.slot.date, booking.slot.start_time);
  const end = toGoogleDate(booking.slot.date, booking.slot.end_time);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: `XCloud-Flow 予約 / お名前: ${booking.customer_name}`,
    location,
  });
  const target = `https://www.google.com/calendar/render?${params.toString()}`;
  return NextResponse.redirect(target, { status: 302 });
}
