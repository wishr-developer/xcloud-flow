import { createClient } from "@/lib/supabase/server";
import { ChatBooking } from "./chat";

export const dynamic = "force-dynamic";

export default async function ChatBookingPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: lessons }, { data: slots }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id,title,description,duration_minutes,price")
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("booking_slots")
      .select(
        "id, date, start_time, end_time, capacity, booked_count, price, status, lesson_id, teacher:teacher_id(name)"
      )
      .gte("date", today)
      .eq("status", "open")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(200),
  ]);

  const availableSlots = (slots ?? []).filter(
    (s) => (s.capacity ?? 1) - (s.booked_count ?? 0) > 0
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        AIチャット予約
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        会話形式で希望条件を聞き、空き枠をご提案します。
      </p>
      <ChatBooking
        lessons={(lessons ?? []) as ChatLesson[]}
        slots={availableSlots as ChatSlot[]}
      />
    </div>
  );
}

export interface ChatLesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}
export interface ChatSlot {
  id: string;
  lesson_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  price: number;
  status: string;
  teacher: { name?: string } | null;
}
