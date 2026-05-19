"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { saveOnboarding } from "./actions";

interface Template {
  id: string;
  displayName: string;
  serviceLabel: string;
  instructorLabel: string;
  heroCopy: string;
}

interface Initial {
  name: string;
  business_type: string;
  primary_color: string;
  logo_url: string;
  tagline: string;
  slug: string;
}

export function OnboardingForm({
  templates,
  initialOrg,
}: {
  templates: Template[];
  initialOrg: Initial;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [businessType, setBusinessType] = useState(initialOrg.business_type);
  const [orgName, setOrgName] = useState(initialOrg.name);
  const [primaryColor, setPrimaryColor] = useState(initialOrg.primary_color);
  const [logoUrl, setLogoUrl] = useState(initialOrg.logo_url);
  const [tagline, setTagline] = useState(initialOrg.tagline);
  const [slug, setSlug] = useState(initialOrg.slug);

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonPrice, setLessonPrice] = useState("3000");
  const [lessonDuration, setLessonDuration] = useState("60");

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");

  const STEPS = ["業種", "スクール情報", "ブランド", "最初の講座", "講師", "完了"];

  const currentTemplate = templates.find((t) => t.id === businessType);

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  function onFinish() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("business_type", businessType);
      fd.set("name", orgName);
      fd.set("slug", slug);
      fd.set("primary_color", primaryColor);
      fd.set("logo_url", logoUrl);
      fd.set("tagline", tagline);
      fd.set("lesson_title", lessonTitle);
      fd.set("lesson_price", lessonPrice);
      fd.set("lesson_duration", lessonDuration);
      fd.set("teacher_name", teacherName);
      fd.set("teacher_email", teacherEmail);
      const res = await saveOnboarding(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push(res?.redirect ?? "/admin");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li
              key={s}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500"
              }`}
            >
              <span className="font-semibold">{n}.</span>
              <span>{s}</span>
              {done && <CheckCircle2 className="h-3 w-3" />}
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Label>業種テンプレート</Label>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {templates.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setBusinessType(t.id)}
                className={`rounded-md border p-3 text-left text-sm transition ${
                  businessType === t.id
                    ? "border-primary bg-primary/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="font-semibold">{t.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {t.serviceLabel} / {t.instructorLabel}
                </div>
              </button>
            ))}
          </div>
          {currentTemplate && (
            <Badge variant="secondary">
              選択中: {currentTemplate.displayName}
            </Badge>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">スクール名</Label>
            <Input
              id="org-name"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="例: みなとヨガスタジオ"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-slug">スクールスラッグ (公開URLに使用)</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="例: minato-yoga"
            />
            <p className="text-xs text-muted-foreground">
              公開URL: /x/{slug || "your-school"}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-tagline">紹介コピー</Label>
            <Textarea
              id="org-tagline"
              rows={3}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={currentTemplate?.heroCopy}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-color">ブランドカラー</Label>
            <div className="flex items-center gap-3">
              <input
                id="org-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="max-w-[140px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-logo">ロゴURL (任意)</Label>
            <Input
              id="org-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div
            className="rounded-md border p-4"
            style={{ borderColor: primaryColor }}
          >
            <div className="text-xs text-muted-foreground">プレビュー</div>
            <div className="mt-1 text-lg font-bold" style={{ color: primaryColor }}>
              {orgName || "スクール名"}
            </div>
            <div className="text-sm text-muted-foreground">
              {tagline || currentTemplate?.heroCopy}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            最初の{currentTemplate?.serviceLabel}を登録してください (後でも追加可能)。
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">タイトル</Label>
            <Input
              id="lesson-title"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder={`例: 朝の${currentTemplate?.serviceLabel}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-price">料金 (円)</Label>
              <Input
                id="lesson-price"
                type="number"
                min={0}
                value={lessonPrice}
                onChange={(e) => setLessonPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-duration">時間 (分)</Label>
              <Input
                id="lesson-duration"
                type="number"
                min={10}
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            最初の{currentTemplate?.instructorLabel}を登録してください (任意)。
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-name">名前</Label>
            <Input
              id="teacher-name"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="例: 山田 真理"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-email">メール (任意)</Label>
            <Input
              id="teacher-email"
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-3 text-sm">
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-emerald-900">
            セットアップ完了の準備が整いました。「完了して管理画面へ」をクリックしてください。
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>業種: {currentTemplate?.displayName}</li>
            <li>スクール名: {orgName || "（未設定）"}</li>
            <li>公開URL: /x/{slug || "（未設定）"}</li>
            <li>カラー: {primaryColor}</li>
            <li>最初の{currentTemplate?.serviceLabel}: {lessonTitle || "（追加しない）"}</li>
            <li>最初の{currentTemplate?.instructorLabel}: {teacherName || "（追加しない）"}</li>
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          disabled={step === 1 || pending}
        >
          戻る
        </Button>
        {step < STEPS.length ? (
          <Button type="button" onClick={next} disabled={pending}>
            次へ
          </Button>
        ) : (
          <Button type="button" onClick={onFinish} disabled={pending}>
            {pending ? "保存中..." : "完了して管理画面へ"}
          </Button>
        )}
      </div>
    </div>
  );
}
