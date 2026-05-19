"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { ChatLesson, ChatSlot } from "./page";
import { Bot, User, Send } from "lucide-react";

type Step =
  | "greeting"
  | "pickLesson"
  | "pickRange"
  | "pickSlot"
  | "form"
  | "submitting"
  | "done";

type Msg = {
  role: "assistant" | "user";
  content: React.ReactNode;
};

const RANGES: { id: string; label: string; days: number }[] = [
  { id: "3d", label: "今後3日", days: 3 },
  { id: "7d", label: "今後7日", days: 7 },
  { id: "14d", label: "今後2週間", days: 14 },
  { id: "all", label: "すべて", days: 365 },
];

export function ChatBooking({
  lessons,
  slots,
  greeting,
  serviceLabel = "レッスン",
  scheduleLabel = "予約枠",
}: {
  lessons: ChatLesson[];
  slots: ChatSlot[];
  greeting?: string;
  serviceLabel?: string;
  scheduleLabel?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        greeting ??
        "こんにちは！XCloud-Flow アシスタントです。ご希望の" +
          serviceLabel +
          "と日時をうかがいながら、空き" +
          scheduleLabel +
          "をご提案します。",
    },
  ]);
  const [selectedLesson, setSelectedLesson] = useState<ChatLesson | null>(null);
  const [selectedRange, setSelectedRange] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ChatSlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"onsite" | "stripe" | "demo">("onsite");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kick off lesson question after greeting
  useEffect(() => {
    if (step === "greeting") {
      const t = setTimeout(() => {
        pushAssistant(`まず、ご希望の${serviceLabel}をお選びください。`);
        setStep("pickLesson");
      }, 400);
      return () => clearTimeout(t);
    }
  }, [step, serviceLabel]);

  function pushAssistant(content: React.ReactNode) {
    setMessages((m) => [...m, { role: "assistant", content }]);
  }
  function pushUser(content: React.ReactNode) {
    setMessages((m) => [...m, { role: "user", content }]);
  }

  function onPickLesson(l: ChatLesson) {
    setSelectedLesson(l);
    pushUser(`${l.title} を希望します`);
    setTimeout(() => {
      pushAssistant(
        `「${l.title}」(${formatCurrency(l.price)}・${l.duration_minutes}分) ですね。次に、ご希望の期間をお選びください。`
      );
      setStep("pickRange");
    }, 300);
  }

  function onPickRange(days: number, label: string) {
    setSelectedRange(days);
    pushUser(label);
    setTimeout(() => {
      const filtered = filterSlots(slots, selectedLesson?.id, days);
      if (filtered.length === 0) {
        pushAssistant(
          `申し訳ありません、その期間に空き${scheduleLabel}が見つかりませんでした。他の期間を選んでください。`
        );
        setStep("pickRange");
        return;
      }
      pushAssistant(
        `${filtered.length}件の空き${scheduleLabel}が見つかりました。ご希望のものをお選びください。`
      );
      setStep("pickSlot");
    }, 300);
  }

  function onPickSlot(s: ChatSlot) {
    setSelectedSlot(s);
    pushUser(
      `${s.date} ${formatTime(s.start_time)}-${formatTime(s.end_time)} を選択`
    );
    setTimeout(() => {
      pushAssistant(
        "ありがとうございます。最後にお客様情報をご入力ください。"
      );
      setStep("form");
    }, 300);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    setStep("submitting");
    pushUser(`${name} (${email})`);
    pushAssistant("予約を確定中です...");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: selectedSlot.id,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        payment_method: method,
        source: "chat",
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      booking_id?: string;
      redirect_url?: string;
      error?: string;
    };
    if (!data.ok) {
      setError(data.error ?? "予約に失敗しました");
      pushAssistant(`申し訳ありません、エラーが発生しました: ${data.error}`);
      setStep("form");
      return;
    }
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
      return;
    }
    pushAssistant("予約が完了しました！詳細ページへ移動します。");
    setStep("done");
    setTimeout(() => {
      router.push(`/book/success?booking=${data.booking_id}`);
    }, 800);
  }

  const filteredSlots = useMemo(
    () =>
      selectedRange
        ? filterSlots(slots, selectedLesson?.id, selectedRange)
        : [],
    [slots, selectedLesson, selectedRange]
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex h-[520px] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role}>
                {m.content}
              </Bubble>
            ))}

            {step === "pickLesson" && (
              <ChoiceList>
                {lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    現在、利用可能なメニューがありません。
                  </p>
                ) : (
                  lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onPickLesson(l)}
                      className="w-full rounded-md border bg-white p-3 text-left text-sm hover:bg-slate-50"
                    >
                      <div className="font-medium">{l.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.duration_minutes}分 · {formatCurrency(l.price)}
                      </div>
                    </button>
                  ))
                )}
              </ChoiceList>
            )}

            {step === "pickRange" && (
              <ChoiceList>
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onPickRange(r.days, r.label)}
                    className="rounded-full border bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    {r.label}
                  </button>
                ))}
              </ChoiceList>
            )}

            {step === "pickSlot" && (
              <ChoiceList>
                {filteredSlots.slice(0, 12).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onPickSlot(s)}
                    className="w-full rounded-md border bg-white p-3 text-left text-sm hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {s.date} {formatTime(s.start_time)}-
                          {formatTime(s.end_time)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.teacher?.name ? `講師: ${s.teacher.name}` : "講師: 未指定"}
                        </div>
                      </div>
                      <Badge variant="success">
                        残{(s.capacity ?? 1) - (s.booked_count ?? 0)}席
                      </Badge>
                    </div>
                  </button>
                ))}
              </ChoiceList>
            )}

            {step === "form" && selectedSlot && (
              <form onSubmit={onSubmit} className="space-y-3 rounded-md border bg-slate-50 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">お名前</Label>
                  <Input
                    id="c-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">メール</Label>
                  <Input
                    id="c-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">電話 (任意)</Label>
                  <Input
                    id="c-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>支払い方法</Label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(
                      [
                        { id: "onsite", label: "現地払い" },
                        { id: "stripe", label: "カード決済" },
                        { id: "demo", label: "デモ決済" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMethod(opt.id)}
                        className={`rounded-md border p-2 transition ${
                          method === opt.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-white hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full">
                  <Send className="mr-1 h-4 w-4" />
                  {formatCurrency(selectedSlot.price)} で予約確定
                </Button>
              </form>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "assistant" | "user";
  children: React.ReactNode;
}) {
  const isAi = role === "assistant";
  return (
    <div className={`flex gap-2 ${isAi ? "justify-start" : "justify-end"}`}>
      {isAi && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          isAi
            ? "rounded-tl-sm bg-slate-100 text-slate-900"
            : "rounded-tr-sm bg-primary text-primary-foreground"
        }`}
      >
        {children}
      </div>
      {!isAi && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-white">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function ChoiceList({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-9 flex flex-wrap gap-2">
      <div className="grid w-full gap-2">{children}</div>
    </div>
  );
}

function filterSlots(
  slots: ChatSlot[],
  lessonId: string | undefined,
  days: number
) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return slots.filter((s) => {
    if (lessonId && s.lesson_id !== lessonId) return false;
    const d = new Date(s.date);
    return d <= end;
  });
}
