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
import { getSiteConfig } from "@/lib/site-config";
import { saveSiteConfig } from "./actions";

export const dynamic = "force-dynamic";

const BUSINESS_OPTIONS: { id: string; label: string }[] = [
  { id: "multi", label: "汎用 (複数業態)" },
  { id: "learning", label: "学習塾 / 教育" },
  { id: "sports", label: "スポーツスクール" },
  { id: "cooking", label: "料理教室" },
  { id: "music", label: "音楽教室" },
  { id: "language", label: "語学教室" },
  { id: "dance", label: "ダンス" },
  { id: "yoga", label: "ヨガ" },
  { id: "fitness", label: "フィットネス" },
  { id: "art", label: "アート" },
  { id: "business", label: "ビジネス研修" },
  { id: "other", label: "その他" },
];

export default async function SiteConfigPage() {
  const cfg = await getSiteConfig();
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
                {BUSINESS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service_label">サービス呼称</Label>
              <Input
                id="service_label"
                name="service_label"
                defaultValue={cfg.service_label}
                placeholder="例: レッスン / クラス / 講座"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schedule_label">予約枠呼称</Label>
              <Input
                id="schedule_label"
                name="schedule_label"
                defaultValue={cfg.schedule_label}
                placeholder="例: 予約枠 / 開催日"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructor_label">講師呼称</Label>
              <Input
                id="instructor_label"
                name="instructor_label"
                defaultValue={cfg.instructor_label}
                placeholder="例: 講師 / コーチ / トレーナー"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="participant_label">受講者呼称</Label>
              <Input
                id="participant_label"
                name="participant_label"
                defaultValue={cfg.participant_label}
                placeholder="例: 受講者 / 生徒 / 会員"
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
