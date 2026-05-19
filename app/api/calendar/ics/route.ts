import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDate(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM:SS — interpret in Asia/Tokyo, output as floating local
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
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
      "id,customer_name,customer_email,slot:slot_id(date,start_time,end_time,location,online_url,lesson:lesson_id(title))"
    )
    .eq("id", bookingId)
    .maybeSingle();
  const booking = data as
    | {
        id: string;
        customer_name: string;
        customer_email: string;
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
  if (!booking) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }
  const date = booking.slot?.date;
  const start = booking.slot?.start_time;
  const end = booking.slot?.end_time;
  if (!date || !start || !end) {
    return NextResponse.json({ ok: false, error: "missing slot" }, { status: 400 });
  }
  const title = booking.slot?.lesson?.title ?? "予約";
  const location = booking.slot?.location ?? booking.slot?.online_url ?? "";
  const dtStart = toIcsDate(date, start);
  const dtEnd = toIcsDate(date, end);
  const description = `XCloud-Flow 予約\\nお名前: ${booking.customer_name}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//XCloud-Flow//Booking//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@xcloud-flow`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    location ? `LOCATION:${escapeIcs(location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${booking.id}.ics"`,
    },
  });
}
