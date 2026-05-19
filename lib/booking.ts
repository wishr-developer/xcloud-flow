import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BookingInput {
  slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  payment_method: "onsite" | "stripe" | "demo";
  memo?: string | null;
  user_id?: string | null;
}

export interface BookingResult {
  ok: boolean;
  booking_id?: string;
  total_price?: number;
  payment_status?: "unpaid" | "pending" | "paid" | "demo_paid";
  redirect_url?: string;
  error?: string;
}

export async function createBookingTransaction(
  input: BookingInput
): Promise<BookingResult> {
  const supabase = createClient();
  return runBooking(supabase, input);
}

async function runBooking(
  supabase: SupabaseClient,
  input: BookingInput
): Promise<BookingResult> {
  const { data: slot, error: slotErr } = await supabase
    .from("booking_slots")
    .select(
      "id, status, capacity, booked_count, price, date, start_time, end_time, lesson:lesson_id(title), teacher:teacher_id(name)"
    )
    .eq("id", input.slot_id)
    .single();

  if (slotErr || !slot) {
    return { ok: false, error: "予約枠が見つかりません" };
  }
  if (slot.status !== "open") {
    return { ok: false, error: "この予約枠は受付停止または満席です" };
  }
  if ((slot.booked_count ?? 0) >= (slot.capacity ?? 1)) {
    return { ok: false, error: "この予約枠は満席です" };
  }

  const nextCount = (slot.booked_count ?? 0) + 1;
  const newStatus = nextCount >= (slot.capacity ?? 1) ? "full" : "open";

  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const isDemo = input.payment_method === "demo" || (input.payment_method === "stripe" && !stripeConfigured);

  const payment_status: BookingResult["payment_status"] = isDemo
    ? "demo_paid"
    : input.payment_method === "stripe"
      ? "pending"
      : "unpaid";

  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .insert({
      user_id: input.user_id ?? null,
      slot_id: input.slot_id,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone ?? null,
      payment_method: isDemo ? "demo" : input.payment_method,
      payment_status,
      attendance_status: "enrolled",
      status: "confirmed",
      total_price: slot.price ?? 0,
      memo: input.memo ?? null,
    })
    .select("id, total_price")
    .single();

  if (bookErr || !booking) {
    return { ok: false, error: bookErr?.message ?? "予約の作成に失敗しました" };
  }

  // Increment booked_count
  await supabase
    .from("booking_slots")
    .update({ booked_count: nextCount, status: newStatus })
    .eq("id", input.slot_id);

  // Upsert customer (CRM)
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, total_bookings, total_spent")
    .eq("email", input.customer_email)
    .maybeSingle();

  const isPaid: boolean =
    (payment_status as string) === "paid" ||
    (payment_status as string) === "demo_paid";

  if (existingCustomer) {
    await supabase
      .from("customers")
      .update({
        name: input.customer_name,
        phone: input.customer_phone ?? null,
        total_bookings: (existingCustomer.total_bookings ?? 0) + 1,
        total_spent:
          (existingCustomer.total_spent ?? 0) +
          (isPaid ? booking.total_price ?? 0 : 0),
        last_booking_at: new Date().toISOString(),
      })
      .eq("id", existingCustomer.id);
  } else {
    await supabase.from("customers").insert({
      user_id: input.user_id ?? null,
      name: input.customer_name,
      email: input.customer_email,
      phone: input.customer_phone ?? null,
      total_bookings: 1,
      total_spent: isPaid ? booking.total_price ?? 0 : 0,
      last_booking_at: new Date().toISOString(),
    });
  }

  // Record payment row
  await supabase.from("payments").insert({
    booking_id: booking.id,
    amount: booking.total_price ?? 0,
    provider: isDemo ? "demo" : input.payment_method === "stripe" ? "stripe" : "onsite",
    status: payment_status,
  });

  // Notification log + LINE webhook
  await sendLineNotification(supabase, booking.id, {
    customer_name: input.customer_name,
    lesson: (slot.lesson as { title?: string } | null)?.title ?? "レッスン",
    date: slot.date,
    start_time: slot.start_time,
    total_price: booking.total_price ?? 0,
  });

  return {
    ok: true,
    booking_id: booking.id,
    total_price: booking.total_price ?? 0,
    payment_status,
  };
}

async function sendLineNotification(
  supabase: SupabaseClient,
  bookingId: string,
  data: {
    customer_name: string;
    lesson: string;
    date: string;
    start_time: string;
    total_price: number;
  }
) {
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "line_webhook_url")
    .maybeSingle();

  const url = setting?.value ?? process.env.LINE_WEBHOOK_URL ?? null;
  const message = `【予約確定】${data.customer_name}様 / ${data.lesson} / ${data.date} ${data.start_time.slice(0, 5)} / ¥${data.total_price}`;

  if (!url) {
    await supabase.from("notification_logs").insert({
      booking_id: bookingId,
      type: "line",
      status: "skipped",
      message: "LINE_WEBHOOK_URL未設定のためスキップ: " + message,
    });
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, booking_id: bookingId }),
    });
    await supabase.from("notification_logs").insert({
      booking_id: bookingId,
      type: "line",
      status: res.ok ? "success" : "failed",
      message: `${res.status}: ${message}`,
    });
  } catch (e) {
    await supabase.from("notification_logs").insert({
      booking_id: bookingId,
      type: "line",
      status: "failed",
      message: `エラー: ${(e as Error).message}`,
    });
  }
}
