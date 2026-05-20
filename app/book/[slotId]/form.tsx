"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

type PaymentMethod = "onsite" | "stripe" | "demo";

export function BookingForm({
  slotId,
  price,
}: {
  slotId: string;
  price: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("onsite");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slotId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        memo: memo || null,
        payment_method: method,
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
      setLoading(false);
      return;
    }
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
      return;
    }
    router.push(`/book/success?booking=${data.booking_id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">お名前</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">電話番号 (任意)</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memo">ご要望 (任意)</Label>
        <Textarea
          id="memo"
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>支払い方法</Label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(
            [
              { id: "onsite", label: "現地払い" },
              { id: "stripe", label: "カード決済" },
            ] as { id: PaymentMethod; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMethod(opt.id)}
              className={`rounded-md border p-2 text-center transition ${
                method === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          カード決済は Stripe を通じて安全に処理されます。
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "送信中..." : `${formatCurrency(price)} を予約する`}
      </Button>
    </form>
  );
}
