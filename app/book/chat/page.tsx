import { createClient } from "@/lib/supabase/server";
import { safeFetch } from "@/lib/safe-fetch";
import { ChatBooking } from "./chat";
import { getSiteConfig, chatGreeting } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function ChatBookingPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const lessonsPromise = supabase
    .from("lessons")
    .select(
      "id,title,description,duration_minutes,price,category,location_type"
    )
    .eq("active", true)
    .order("created_at", { ascending: false }) as unknown as PromiseLike<{
    data: ChatLesson[] | null;
    error: unknown;
  }>;

  const slotsPromise = supabase
    .from("booking_slots")
    .select(
      "id, date, start_time, end_time, capacity, booked_count, price, status, lesson_id, location, online_url, teacher:teacher_id(name)"
    )
    .gte("date", today)
    .eq("status", "open")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(200) as unknown as PromiseLike<{
    data: ChatSlot[] | null;
    error: unknown;
  }>;

  const [lessons, slots, siteConfig] = await Promise.all([
    safeFetch<ChatLesson[]>(lessonsPromise, []),
    safeFetch<ChatSlot[]>(slotsPromise, []),
    getSiteConfig(),
  ]);

  const availableSlots = slots.filter(
    (s) => (s.capacity ?? 1) - (s.booked_count ?? 0) > 0
  );

  const greeting = chatGreeting(siteConfig);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        AIチャット予約
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        会話形式で希望条件を聞き、空き{siteConfig.schedule_label}をご提案します。
      </p>
      <ChatBooking
        lessons={lessons}
        slots={availableSlots}
        greeting={greeting}
        serviceLabel={siteConfig.service_label}
        scheduleLabel={siteConfig.schedule_label}
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
  category?: string | null;
  location_type?: string | null;
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
  location?: string | null;
  online_url?: string | null;
  teacher: { name?: string } | null;
}
