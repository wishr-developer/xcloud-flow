"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type Method = "onsite" | "stripe" | "demo" | "free";

export function EnrollButton({
  courseId,
  courseSlug,
  price,
  isAuthed,
}: {
  courseId: string;
  courseSlug: string;
  price: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [method, setMethod] = useState<Method>(price === 0 ? "free" : "stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        customer_name: name,
        customer_email: email,
        coupon_code: coupon || null,
        payment_method: price === 0 ? "free" : method,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      error?: string;
      enrollment_id?: string;
      redirect_url?: string;
    };
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "登録に失敗しました");
      return;
    }
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
      return;
    }
    router.push(`/courses/${courseSlug}/learn`);
  }

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        {price === 0 ? "無料で受講する" : `${formatCurrency(price)} で受講する`}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="enr-name">お名前</Label>
        <Input
          id="enr-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enr-email">メール</Label>
        <Input
          id="enr-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enr-coupon">クーポンコード (任意)</Label>
        <Input
          id="enr-coupon"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          placeholder="WELCOME20 など"
        />
      </div>
      {price > 0 && (
        <div className="space-y-1.5">
          <Label>支払い方法</Label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(
              [
                { id: "stripe", label: "カード" },
                { id: "onsite", label: "請求書" },
                { id: "demo", label: "デモ" },
              ] as { id: Method; label: string }[]
            ).map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={`rounded-md border p-2 transition ${
                  method === opt.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {!isAuthed && (
        <p className="text-xs text-muted-foreground">
          メールアドレスをキーに登録します。後ほどログインすればマイページから受講状況が確認できます。
        </p>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "登録中..." : "登録を確定"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
