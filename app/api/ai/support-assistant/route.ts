import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteConfig } from "@/lib/site-config";
import { getBusinessTemplate } from "@/lib/business-templates";
import { rateLimit } from "@/lib/rate-limit";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anon";
  const allow = rateLimit({ key: `ai-support:${ip}`, limit: 30, windowMs: 60_000 });
  if (!allow.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 }
    );
  }

  let messages: ChatMessage[] = [];
  let orgSlug: string | null = null;
  try {
    const body = (await req.json()) as { messages?: ChatMessage[]; org?: string };
    messages = Array.isArray(body.messages) ? body.messages : [];
    orgSlug = body.org ?? null;
  } catch {
    messages = [];
  }
  const userText =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const cfg = await getSiteConfig().catch(() => null);
  type OrgContext = {
    name: string;
    business_type: string;
    contact_email: string | null;
  };
  let orgContext: OrgContext | null = null;
  if (orgSlug) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("organizations")
        .select("name,business_type,contact_email")
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

  // Load top FAQs so even without OpenAI we have something useful.
  let faqs: { question: string; answer: string }[] = [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("published", true)
      .order("order_index", { ascending: true })
      .limit(8);
    faqs = (data as typeof faqs) ?? [];
  } catch {
    faqs = [];
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const orgPart = orgContext
        ? `組織: ${orgContext.name} (${orgContext.business_type})${orgContext.contact_email ? ` / 連絡先 ${orgContext.contact_email}` : ""}。`
        : "";
      const system: ChatMessage = {
        role: "system",
        content:
          `あなたは「${cfg?.product_name ?? "XCloud-Flow"}」の${template.displayName}向けカスタマーサポートです。` +
          orgPart +
          `FAQ: ${faqs.map((f) => `Q:${f.question} A:${f.answer}`).join(" / ")}。` +
          `分からない場合は /contact のフォームに誘導してください。`,
      };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 400,
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
            faqs,
          });
        }
      } else {
        console.warn("[ai support] openai non-200", res.status);
      }
    } catch (e) {
      console.warn("[ai support] openai threw:", e);
    }
  }

  // Heuristic fallback: match user text against FAQ keywords
  const lower = userText.toLowerCase();
  const matched = faqs.find((f) =>
    lower
      .split(/\s+/)
      .some((w) => w && f.question.toLowerCase().includes(w))
  );
  const reply = matched
    ? matched.answer
    : userText
      ? `「${userText}」についてはお問い合わせフォーム (/contact) よりご連絡ください。担当者よりご返信いたします。`
      : `こんにちは。ご質問の内容を教えてください。よくある質問は /faq にもまとめております。`;

  return NextResponse.json({ ok: true, mode: "rule-based", reply, faqs });
}
