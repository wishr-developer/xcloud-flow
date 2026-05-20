import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Sparkles } from "lucide-react";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
}

export default async function OnboardingDonePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let org: OrgRow | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    const orgId = (profile as { organization_id?: string | null } | null)
      ?.organization_id ?? null;
    if (orgId) {
      const { data } = await supabase
        .from("organizations")
        .select("id,name,slug,primary_color")
        .eq("id", orgId)
        .maybeSingle();
      org = (data as OrgRow | null) ?? null;
    }
  } catch {
    org = null;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";
  const publicUrl = org ? `${siteUrl}/x/${org.slug}` : null;
  const chatUrl = org ? `${siteUrl}/book/chat?org=${org.slug}` : `${siteUrl}/book/chat`;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 via-white to-white">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Badge variant="secondary">セットアップ完了</Badge>
        </div>
      </header>
      <main className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ようこそ、{org?.name ?? "あなたのスクール"} さん！
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="text-muted-foreground">
              基本セットアップが完了しました。ここから3分以内に予約導線を確認できます。
            </p>

            {publicUrl && (
              <div className="rounded-md border bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  あなたの公開URL
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="break-all rounded bg-white px-2 py-1 text-xs">
                    {publicUrl}
                  </code>
                  <CopyButton text={publicUrl} />
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              公開ページを発行しました。続けて以下から、運用に必要な準備を進めてください。
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ActionCard
                title="公開ページを見る"
                description="お客様にご案内する予約 LP を確認できます。"
                href={publicUrl ?? "/"}
                cta="開く"
                external={!!publicUrl}
                disabled={!publicUrl}
              />
              <ActionCard
                title="最初の予約枠を公開"
                description="予約枠を追加すると、すぐに予約受付を開始できます。"
                href="/admin/slots"
                cta="予約枠を追加"
              />
              <ActionCard
                title="講師を追加"
                description="担当講師を登録すると、予約枠に紐付けられます。"
                href="/admin/teachers"
                cta="講師を追加"
              />
              <ActionCard
                title="プランを確認"
                description="ご利用中のプランと請求状況を確認できます。"
                href="/admin/subscription"
                cta="プランを確認"
              />
              <ActionCard
                title="システム状態"
                description="連携サービスの接続状況を確認できます。"
                href="/admin/system-status"
                cta="確認"
              />
              <ActionCard
                title="管理画面へ"
                description="ダッシュボードで予約・売上・通知ログを確認できます。"
                href="/admin"
                cta="開く"
              />
            </div>

            <div className="rounded-md border border-dashed bg-white p-4 text-xs text-muted-foreground">
              <Sparkles className="mb-1 inline h-3 w-3" /> ヒント:
              繰り返しクラス (毎週開催など) は{" "}
              <Link className="text-primary underline" href="/admin/recurring">
                /admin/recurring
              </Link>{" "}
              から一括登録できます。導入時のサポートが必要な場合は{" "}
              <Link className="text-primary underline" href="/support">
                /support
              </Link>{" "}
              よりお気軽にご相談ください。
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  cta,
  external,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      <div className="mt-auto pt-2">
        {disabled ? (
          <Button size="sm" variant="outline" disabled>
            {cta}
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {cta}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
