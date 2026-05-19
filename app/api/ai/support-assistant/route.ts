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
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    messages = [];
  }
  const userText =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const cfg = await getSiteConfig().catch(() => null);
  const template = getBusinessTemplate(cfg?.business_type ?? "multi");

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
      const system: ChatMessage = {
        role: "system",
        content:
          `あなたは「${cfg?.product_name ?? "XCloud-Flow"}」の${template.displayName}向けカスタマーサポートです。` +
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
          messages: [system, ...messages],
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
