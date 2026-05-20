import { createClient } from "@/lib/supabase/server";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /**
   * Used only for logging / audit. Booking / invitation / contact ...
   */
  category?: "booking" | "invitation" | "contact" | "system";
  /**
   * Optional organization scope. Logged to notification_logs so org admins
   * can audit outgoing email per-tenant.
   */
  organizationId?: string | null;
  /**
   * If true, the audit log entry is still written even on success. Defaults to true.
   */
  log?: boolean;
}

export interface SendEmailResult {
  ok: boolean;
  provider: "resend" | "skipped" | "failed";
  id?: string;
  error?: string;
}

const FROM =
  process.env.RESEND_FROM ??
  process.env.EMAIL_FROM ??
  "XCloud-Flow <noreply@xcloud-flow.app>";

const REPLY_TO =
  process.env.SUPPORT_EMAIL ??
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
  null;

/**
 * Send an email through Resend when RESEND_API_KEY is configured.
 * When the key is missing the call resolves successfully and the attempt is
 * recorded in notification_logs as "skipped" so the rest of the request flow
 * (booking creation, invitation accept, etc.) never blocks on email delivery.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    await safeLog({
      organizationId: input.organizationId ?? null,
      type: "email",
      status: "skipped",
      message: `[${input.category ?? "system"}] ${input.to}: ${input.subject}`,
    });
    return { ok: true, provider: "skipped" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text ?? stripHtml(input.html),
        reply_to: REPLY_TO ?? undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      await safeLog({
        organizationId: input.organizationId ?? null,
        type: "email",
        status: "failed",
        message: `[${input.category ?? "system"}] ${input.to}: ${res.status} ${text.slice(0, 240)}`,
      });
      return { ok: false, provider: "failed", error: `${res.status}` };
    }
    const data = (await res.json()) as { id?: string };
    await safeLog({
      organizationId: input.organizationId ?? null,
      type: "email",
      status: "success",
      message: `[${input.category ?? "system"}] ${input.to}: ${input.subject}`,
    });
    return { ok: true, provider: "resend", id: data.id };
  } catch (e) {
    await safeLog({
      organizationId: input.organizationId ?? null,
      type: "email",
      status: "failed",
      message: `[${input.category ?? "system"}] ${input.to}: ${(e as Error).message}`,
    });
    return { ok: false, provider: "failed", error: (e as Error).message };
  }
}

interface NotifLog {
  organizationId: string | null;
  type: "email" | "line" | "system";
  status: "success" | "skipped" | "failed";
  message: string;
}

async function safeLog(entry: NotifLog) {
  try {
    const supabase = createClient();
    await supabase.from("notification_logs").insert({
      organization_id: entry.organizationId,
      type: entry.type,
      status: entry.status,
      message: entry.message,
    });
  } catch {
    // Best-effort — never let a logging failure surface.
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Tiny HTML helper — escapes user-supplied content before embedding in
 * a templated email.
 */
export function escapeHtml(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
