import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getSiteConfig } from "@/lib/site-config";
import { saveSiteConfig } from "./actions";
import {
  listBusinessTemplates,
  getBusinessTemplate,
} from "@/lib/business-templates";

export const dynamic = "force-dynamic";

export default async function SiteConfigPage() {
  const cfg = await getSiteConfig();
  const templates = listBusinessTemplates();
  const current = getBusinessTemplate(cfg.business_type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">サイト設定</h1>
        <p className="text-sm text-muted-foreground">
          業種テンプレートを切り替えると、AIチャットの文言や呼称が変わります。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>現在のテンプレート</CardTitle>
          <CardDescription>
            <Badge variant="secondary">{current.displayName}</Badge>
            <span className="ml-2 text-xs">
              呼称: {current.serviceLabel} / {current.instructorLabel} /{" "}
              {current.participantLabel} / {current.scheduleLabel}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>業種 / ブランディング</CardTitle>
          <CardDescription>
            プロダクト名、呼称ラベル、業種テンプレートをまとめて編集します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSiteConfig} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="product_name">プロダクト名</Label>
              <Input
                id="product_name"
                name="product_name"
                defaultValue={cfg.product_name}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="business_type">業種テンプレート</Label>
              <select
                id="business_type"
                name="business_type"
                defaultValue={cfg.business_type}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                テンプレートを変更すると、空欄の呼称・コピー欄は自動でその業種のデフォルトに置き換わります。
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service_label">サービス呼称</Label>
              <Input
                id="service_label"
                name="service_label"
                defaultValue={cfg.service_label}
                placeholder={current.serviceLabel}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schedule_label">予約枠呼称</Label>
              <Input
                id="schedule_label"
                name="schedule_label"
                defaultValue={cfg.schedule_label}
                placeholder={current.scheduleLabel}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructor_label">講師呼称</Label>
              <Input
                id="instructor_label"
                name="instructor_label"
                defaultValue={cfg.instructor_label}
                placeholder={current.instructorLabel}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="participant_label">受講者呼称</Label>
              <Input
                id="participant_label"
                name="participant_label"
                defaultValue={cfg.participant_label}
                placeholder={current.participantLabel}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="hero_copy">ヒーローコピー</Label>
              <Textarea
                id="hero_copy"
                name="hero_copy"
                rows={3}
                defaultValue={cfg.hero_copy ?? ""}
                placeholder={current.heroCopy}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="chat_opening_message">
                AIチャット 冒頭メッセージ
              </Label>
              <Textarea
                id="chat_opening_message"
                name="chat_opening_message"
                rows={3}
                defaultValue={cfg.chat_opening_message ?? ""}
                placeholder={current.chatOpeningMessage}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="sample_categories">
                カテゴリ候補 (カンマ区切り)
              </Label>
              <Input
                id="sample_categories"
                name="sample_categories"
                defaultValue={(cfg.sample_categories ?? []).join(", ")}
                placeholder={current.sampleCategories.join(", ")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primary_color">プライマリーカラー (#hex)</Label>
              <Input
                id="primary_color"
                name="primary_color"
                defaultValue={cfg.primary_color}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">タイムゾーン</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={cfg.timezone}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">通貨</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={cfg.currency}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale">ロケール</Label>
              <Input id="locale" name="locale" defaultValue={cfg.locale} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">保存</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
