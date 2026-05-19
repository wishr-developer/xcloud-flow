import { createClient } from "@/lib/supabase/server";
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
import { Badge } from "@/components/ui/badge";
import { saveSettings, promoteToAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase.from("app_settings").select("*");
  const get = (k: string) =>
    settings?.find((s) => s.key === k)?.value ?? "";

  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground">
          通知先・決済・管理者権限を設定します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知・決済</CardTitle>
          <CardDescription>
            LINE Notify / Webhook URL や Stripe price ID を保存します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="line_webhook_url">LINE Webhook URL</Label>
              <Input
                id="line_webhook_url"
                name="line_webhook_url"
                placeholder="https://example.com/your-line-webhook"
                defaultValue={get("line_webhook_url")}
              />
              <p className="text-xs text-muted-foreground">
                未設定時は通知が「skipped」としてログされます。
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stripe_price_id">Stripe price ID (任意)</Label>
              <Input
                id="stripe_price_id"
                name="stripe_price_id"
                placeholder="price_xxx"
                defaultValue={get("stripe_price_id")}
              />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Stripe接続:</span>
                <Badge variant={stripeEnabled ? "success" : "secondary"}>
                  {stripeEnabled ? "STRIPE_SECRET_KEY 設定済み" : "未設定 (デモ決済を使用)"}
                </Badge>
              </div>
            </div>
            <Button type="submit">保存</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>管理者権限を付与</CardTitle>
          <CardDescription>
            既存ユーザーのメールアドレスを指定して admin に昇格できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={promoteToAdmin} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">対象メール</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <Button type="submit">管理者に設定</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            ※ MVPでは1人目もこの操作で昇格してください。Supabaseの SQL から直接更新も可能です。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
