import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = ipOf(request);
  const allow = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 60_000 });
  if (!allow.ok) {
    return NextResponse.json(
      { ok: false, error: "短時間に多くのリクエストを受け取りました。しばらく経ってから再度お試しください。" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.email || !body.message) {
    return NextResponse.json(
      { ok: false, error: "必須項目が不足しています" },
      { status: 400 }
    );
  }
  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    subject: body.subject || null,
    message: body.message,
    status: "new",
  });
  if (error) {
    console.warn("[contact] insert failed:", error.message);
    return NextResponse.json(
      {
        ok: false,
        error:
          "現在、お問い合わせフォームを処理できません。お手数ですがしばらくしてから再度お試しください。",
      },
      { status: 503 }
    );
  }

  // Acknowledge to the customer + notify operator (best-effort).
  const supportEmail =
    process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null;
  await sendEmail({
    to: body.email,
    subject: "【XCloud-Flow】お問い合わせを受け付けました",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <h2>お問い合わせを受け付けました</h2>
        <p>${escapeHtml(body.name)} 様、お問い合わせをいただきありがとうございます。担当よりご連絡いたします。</p>
        <hr/>
        <p style="white-space: pre-wrap; font-size:14px;">${escapeHtml(body.message)}</p>
      </div>
    `,
    category: "contact",
  });
  if (supportEmail) {
    await sendEmail({
      to: supportEmail,
      subject: `【お問い合わせ】${body.subject ?? "新規問い合わせ"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
          <h2>新規お問い合わせ</h2>
          <p><strong>${escapeHtml(body.name)}</strong> (${escapeHtml(body.email)})</p>
          ${body.phone ? `<p>電話: ${escapeHtml(body.phone)}</p>` : ""}
          ${body.subject ? `<p>件名: ${escapeHtml(body.subject)}</p>` : ""}
          <pre style="white-space: pre-wrap; font-size:14px;">${escapeHtml(body.message)}</pre>
        </div>
      `,
      category: "contact",
    });
  }

  return NextResponse.json({ ok: true });
}

function ipOf(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}
