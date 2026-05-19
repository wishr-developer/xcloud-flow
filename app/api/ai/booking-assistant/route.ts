import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteConfig } from "@/lib/site-config";
import { getBusinessTemplate } from "@/lib/business-templates";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let orgSlug: string | null = null;
  try {
    const body = (await req.json()) as { messages?: ChatMessage[]; org?: string };
    messages = Array.isArray(body.messages) ? body.messages : [];
    orgSlug = body.org ?? null;
  } catch {
    messages = [];
  }
  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const cfg = await getSiteConfig().catch(() => null);
  type OrgContext = {
    name: string;
    business_type: string;
    tagline: string | null;
    contact_email: string | null;
  };
  let orgContext: OrgContext | null = null;
  if (orgSlug) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("organizations")
        .select("name,business_type,tagline,contact_email")
        .eq("slug", orgSlug)
        .maybeSingle();
      orgContext = (data as OrgContext | null) ?? null;
    } catch {
      orgContext = null;
    }
  }
  const businessType =
    orgContext?.business_type ?? cfg?.business_type ?? "multi";
  const template = getBusinessTemplate(businessType);

  // Fetch a small list of active lessons so we can suggest something useful.
  let suggestions: { id: string; title: string; price: number }[] = [];
  try {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id,title,price")
      .eq("active", true)
      .limit(5);
    suggestions = (lessons as typeof suggestions) ?? [];
    if (suggestions.length === 0) {
      const { data: slots } = await supabase
        .from("booking_slots")
        .select("id,date,start_time,price,lesson:lesson_id(title)")
        .gte("date", today)
        .eq("status", "open")
        .limit(5);
      type SlotRow = {
        id: string;
        price: number;
        lesson: { title?: string } | { title?: string }[] | null;
      };
      const slotSuggestions = ((slots ?? []) as SlotRow[]).map((s) => {
        const lessonTitle = Array.isArray(s.lesson)
          ? s.lesson[0]?.title
          : s.lesson?.title;
        return {
          id: s.id,
          title: lessonTitle ?? "予約枠",
          price: s.price,
        };
      });
      suggestions = slotSuggestions;
    }
  } catch {
    suggestions = [];
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const orgPart = orgContext
        ? `組織: ${orgContext.name} (${orgContext.business_type})${orgContext.tagline ? ` / ${orgContext.tagline}` : ""}。`
        : "";
      const system: ChatMessage = {
        role: "system",
        content:
          `あなたは「${cfg?.product_name ?? "XCloud-Flow"}」の${template.displayName}向けの予約アシスタントです。` +
          orgPart +
          `${template.serviceLabel}の予約を、丁寧で簡潔な日本語で案内してください。` +
          `候補メニュー: ${suggestions.map((s) => s.title).join(" / ") || "（メニュー未登録）"}。` +
          `分からない場合は「お問い合わせフォーム」へ誘導してください。`,
      };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.5,
          max_tokens: 400,
          // Strip role overrides from user-provided messages to avoid prompt injection
          messages: [
            system,
            ...messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .slice(-8),
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          return NextResponse.json({
            ok: true,
            mode: "openai",
            reply,
            suggestions,
          });
        }
      } else {
        console.warn("[ai booking] openai non-200", res.status);
      }
    } catch (e) {
      console.warn("[ai booking] openai threw:", e);
    }
  }

  // Heuristic fallback — keeps the chat usable without any API key.
  const reply = ruleBasedReply(lastUser, template, suggestions);
  return NextResponse.json({
    ok: true,
    mode: "rule-based",
    reply,
    suggestions,
  });
}

function ruleBasedReply(
  userText: string,
  template: ReturnType<typeof getBusinessTemplate>,
  suggestions: { id: string; title: string; price: number }[]
): string {
  const t = userText.toLowerCase();
  if (!userText) {
    return template.chatOpeningMessage;
  }
  if (/料金|価格|いくら|cost|price/.test(userText)) {
    if (suggestions.length === 0) {
      return "現在ご案内できる料金プランがまだ登録されていません。お手数ですが、料金プランページをご覧ください: /pricing";
    }
    const top = suggestions
      .slice(0, 3)
      .map((s) => `${s.title}: ¥${s.price.toLocaleString()}`)
      .join(" / ");
    return `料金の目安はこちらです → ${top}。詳細は /pricing もご覧ください。`;
  }
  if (/オンライン|online/.test(t)) {
    return `オンライン対応の${template.serviceLabel}もご用意しています。ご希望の曜日と時間帯を教えてください。`;
  }
  if (/初心者|beginner/.test(t)) {
    return `初心者の方向け${template.serviceLabel}もございます。お住まいの地域とご希望の時間帯を教えていただけますか？`;
  }
  if (/土日|週末|weekend|saturday|sunday/.test(t)) {
    return `週末開催の${template.scheduleLabel}を中心にご案内します。何時頃をご希望ですか？`;
  }
  if (suggestions.length > 0) {
    const list = suggestions.slice(0, 3).map((s) => `「${s.title}」`).join("、");
    return `${list} などがご利用いただけます。気になる${template.serviceLabel}はありますか？`;
  }
  return `ありがとうございます！「${userText}」ですね。担当者にも共有しますので、お問い合わせフォームから詳細をお送りいただけますと幸いです。`;
}
