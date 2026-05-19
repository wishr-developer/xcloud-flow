import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { token: string };
}

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  organization_id: string;
  organization: { name?: string; slug?: string } | null;
}

export default async function InvitePage({ params }: PageProps) {
  const supabase = createClient();
  let invite: InvitationRow | null = null;
  try {
    const { data } = await supabase
      .from("invitations")
      .select(
        "id,email,role,status,expires_at,organization_id,organization:organization_id(name,slug)"
      )
      .eq("token", params.token)
      .maybeSingle();
    invite = (data as unknown as InvitationRow) ?? null;
  } catch {
    invite = null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expired = invite
    ? new Date(invite.expires_at).getTime() < Date.now()
    : true;

  const orgName = invite?.organization?.name ?? "スクール";

  if (!invite) {
    return (
      <SimpleShell>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>招待が見つかりません</CardTitle>
            <CardDescription>
              URLが正しいかご確認ください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">ホームへ</Link>
            </Button>
          </CardContent>
        </Card>
      </SimpleShell>
    );
  }

  if (invite.status === "accepted") {
    redirect("/admin");
  }

  return (
    <SimpleShell>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>
            {orgName} への招待
            <Badge className="ml-2" variant="secondary">
              {invite.role}
            </Badge>
          </CardTitle>
          <CardDescription>
            {invite.email} 宛の招待です。
            {expired && (
              <span className="ml-2 text-destructive">期限切れです。</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="space-y-3 text-sm">
              <p>
                招待を受け取るには、まず同じメールアドレスでアカウントを作成してログインしてください。
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link
                    href={`/signup?invite=${params.token}&email=${encodeURIComponent(
                      invite.email
                    )}`}
                  >
                    新規登録
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/login?next=/invite/${params.token}`}>
                    ログイン
                  </Link>
                </Button>
              </div>
            </div>
          ) : expired || invite.status !== "pending" ? (
            <div className="text-sm text-muted-foreground">
              この招待はすでに利用できません。
            </div>
          ) : (
            <form action={acceptInvitation}>
              <input type="hidden" name="token" value={params.token} />
              <Button type="submit" size="lg">
                {orgName} に参加する
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </SimpleShell>
  );
}

function SimpleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex flex-1 items-center justify-center py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
