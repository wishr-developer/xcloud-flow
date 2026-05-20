import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, escapeHtml } from "@/lib/email";

export interface BookingInput {
  slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  payment_method: "onsite" | "stripe" | "demo";
  memo?: string | null;
  participant_note?: string | null;
  source?: "web" | "chat" | "admin" | "api";
  user_id?: string | null;
}

export interface BookingResult {
  ok: boolean;
  booking_id?: string;
  total_price?: number;
  payment_status?: "unpaid" | "pending" | "paid" | "demo_paid";
  redirect_url?: string;
  /** Returned so the public success page can render the booking under tight RLS. */
  qr_token?: string;
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
      participant_note: input.participant_note ?? null,
      source: input.source ?? "web",
    })
    .select("id, total_price, qr_token, organization_id")
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

  const lessonTitle = (slot.lesson as { title?: string } | null)?.title ?? "レッスン";
  const bookingRow = booking as {
    id: string;
    total_price: number | null;
    qr_token: string | null;
    organization_id: string | null;
  };

  // Notification log + LINE webhook
  await sendLineNotification(supabase, bookingRow.id, {
    customer_name: input.customer_name,
    lesson: lessonTitle,
    date: slot.date,
    start_time: slot.start_time,
    total_price: bookingRow.total_price ?? 0,
  });

  // Customer email confirmation (sent only when RESEND_API_KEY is set).
  await sendBookingConfirmationEmail({
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    lesson: lessonTitle,
    date: slot.date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    total_price: bookingRow.total_price ?? 0,
    booking_id: bookingRow.id,
    qr_token: bookingRow.qr_token,
    organization_id: bookingRow.organization_id,
  });

  return {
    ok: true,
    booking_id: bookingRow.id,
    total_price: bookingRow.total_price ?? 0,
    payment_status,
    qr_token: bookingRow.qr_token ?? undefined,
  };
}

async function sendBookingConfirmationEmail(data: {
  customer_name: string;
  customer_email: string;
  lesson: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  booking_id: string;
  qr_token: string | null;
  organization_id: string | null;
}): Promise<void> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";
  const successUrl = data.qr_token
    ? `${siteUrl}/book/success?booking=${data.booking_id}&t=${data.qr_token}`
    : `${siteUrl}/book/success?booking=${data.booking_id}`;
  const subject = `【予約確定】${data.lesson} (${data.date})`;
  const safe = (s: string) => escapeHtml(s);
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="color:#0f172a;">ご予約ありがとうございます</h2>
      <p>${safe(data.customer_name)} 様</p>
      <p>以下の内容でご予約をお受けしました。</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tbody>
          <tr><td style="padding:6px 0; color:#64748b;">メニュー</td><td style="padding:6px 0;">${safe(data.lesson)}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">日時</td><td style="padding:6px 0;">${safe(data.date)} ${safe(data.start_time.slice(0,5))} - ${safe(data.end_time.slice(0,5))}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">金額</td><td style="padding:6px 0;">¥${data.total_price.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <p><a href="${successUrl}" style="display:inline-block; background:#4F46E5; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none;">予約詳細を開く</a></p>
      <p style="font-size:12px; color:#64748b; margin-top:24px;">このメールは XCloud-Flow から自動送信されています。ご返信の必要はありません。</p>
    </div>
  `;
  await sendEmail({
    to: data.customer_email,
    subject,
    html,
    category: "booking",
    organizationId: data.organization_id,
  });
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
