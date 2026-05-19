import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { CheckCircle2, AlertTriangle, XCircle, Server } from "lucide-react";

export const dynamic = "force-dynamic";

interface Check {
  label: string;
  ok: boolean | "warn";
  detail?: string;
}

export default async function SystemStatusPage() {
  const env = {
    supabase: isSupabaseConfigured(),
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripeStarter: !!process.env.STRIPE_PRICE_STARTER,
    stripePro: !!process.env.STRIPE_PRICE_PRO,
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    openai: !!process.env.OPENAI_API_KEY,
    line: !!process.env.LINE_WEBHOOK_URL,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Probe Supabase tables to detect missing migrations.
  const tableChecks: Record<string, boolean> = {
    organizations: false,
    subscriptions: false,
    audit_logs: false,
    invitations: false,
    recurring_rules: false,
    in_app_notifications: false,
    locations: false,
  };
  let migrationLevel = 0;

  if (env.supabase) {
    try {
      const supabase = createClient();
      const probes = Object.keys(tableChecks);
      await Promise.all(
        probes.map(async (t) => {
          try {
            const { error } = await supabase
              .from(t)
              .select("id", { head: true, count: "exact" });
            tableChecks[t] = !error;
          } catch {
            tableChecks[t] = false;
          }
        })
      );
      if (tableChecks.organizations) migrationLevel = 4;
      if (tableChecks.audit_logs) migrationLevel = 5;
      if (tableChecks.invitations) migrationLevel = 6;
    } catch {
      // ignore
    }
  }

  const checks: Check[] = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY",
      ok: env.supabase,
      detail: env.supabase
        ? "✅ 設定済み"
        : "未設定: ページは fallback で動作しますが、データは保存されません。",
    },
    {
      label: "NEXT_PUBLIC_SITE_URL",
      ok: env.siteUrl,
      detail: env.siteUrl ? "✅ 設定済み" : "未設定: OG/招待リンクが xcloud-flow.vercel.app になります。",
    },
    {
      label: "Stripe (STRIPE_SECRET_KEY)",
      ok: env.stripe ? true : "warn",
      detail: env.stripe
        ? "✅ 本番決済モード"
        : "未設定: /pricing と /admin/subscription はデモ動作になります。",
    },
    {
      label: "Stripe Price ID (Starter / Pro)",
      ok: env.stripe && (!env.stripeStarter || !env.stripePro) ? "warn" : true,
      detail:
        env.stripe && (!env.stripeStarter || !env.stripePro)
          ? "Stripe は接続済みですが、STRIPE_PRICE_STARTER / STRIPE_PRICE_PRO が未設定です。"
          : env.stripeStarter || env.stripePro
            ? "✅ 設定済み"
            : "未設定 (デモ動作)",
    },
    {
      label: "Stripe Webhook (STRIPE_WEBHOOK_SECRET)",
      ok: env.stripeWebhook ? true : "warn",
      detail: env.stripeWebhook
        ? "✅ 設定済み"
        : "未設定: Webhook 署名検証はスキップされます。",
    },
    {
      label: "OpenAI (OPENAI_API_KEY)",
      ok: env.openai ? true : "warn",
      detail: env.openai
        ? "✅ AI予約/サポートは本物LLM応答"
        : "未設定: AI予約/サポートはルールベース fallback で動作。",
    },
    {
      label: "LINE Webhook (LINE_WEBHOOK_URL)",
      ok: env.line ? true : "warn",
      detail: env.line
        ? "✅ 設定済み"
        : "未設定: LINE通知は notification_logs に skipped として残ります。",
    },
    {
      label: "Supabase Service Role Key",
      ok: env.serviceRole ? true : "warn",
      detail: env.serviceRole
        ? "✅ 設定済み (RLSバイパス用)"
        : "未設定: 一部の運用バッチ/Stripe webhook の DB 書き込みは制限されます。",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">システム状態</h1>
        <p className="text-sm text-muted-foreground">
          本番リリース前の環境変数 / Supabase 接続 / マイグレーション適用状況を確認します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            ヘルスチェック
          </CardTitle>
          <CardDescription>
            <code className="rounded bg-slate-100 px-1">/api/health</code> も同じ情報を JSON で返します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {checks.map((c) => (
              <li
                key={c.label}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{c.label}</div>
                  {c.detail && (
                    <div className="text-xs text-muted-foreground">
                      {c.detail}
                    </div>
                  )}
                </div>
                {c.ok === true ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> OK
                  </Badge>
                ) : c.ok === "warn" ? (
                  <Badge variant="warning">
                    <AlertTriangle className="mr-1 h-3 w-3" /> WARN
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" /> FAIL
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">適用済みマイグレーション (推定)</CardTitle>
          <CardDescription>
            主要テーブルの存在を probe して判定しています (read-onlyチェック)。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(tableChecks).map(([t, ok]) => (
              <div
                key={t}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>{t}</span>
                {ok ? (
                  <Badge variant="success">found</Badge>
                ) : (
                  <Badge variant="secondary">missing</Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            推定マイグレーションレベル: <Badge>0006以上 ({migrationLevel}+)</Badge>
            <span className="ml-2">
              本番化前に <code>0007_production_hardening.sql</code> も適用してください。
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">本番リリースチェック</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <code>docs/RELEASE_CHECKLIST.md</code> を順番に確認
            </li>
            <li>
              <code>/api/health</code> が <code>ok: true</code> を返すこと
            </li>
            <li>
              <code>/sitemap.xml</code> / <code>/robots.txt</code> / <code>/manifest.webmanifest</code> が配信されること
            </li>
            <li>
              新規ユーザーが <code>/signup</code> → <code>/onboarding</code> → <code>/admin</code> に到達できること
            </li>
            <li>別アカウントで別組織を作成し、互いのデータが見えないこと</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
