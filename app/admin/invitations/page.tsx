import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { createInvitation, revokeInvitation } from "./actions";
import { formatDateTime } from "@/lib/utils";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export default async function AdminInvitationsPage() {
  const supabase = createClient();
  let rows: InvitationRow[] = [];
  try {
    const { data } = await supabase
      .from("invitations")
      .select("id,email,role,status,token,expires_at,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    rows = (data as InvitationRow[] | null) ?? [];
  } catch {
    rows = [];
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">招待</h1>
        <p className="text-sm text-muted-foreground">
          管理者・スタッフ・講師・受講者をメールで招待します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規招待を作成</CardTitle>
          <CardDescription>
            メールプロバイダ未設定の場合は招待URLが画面に表示されますので、直接お送りください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createInvitation}
            className="grid gap-3 sm:grid-cols-[1fr_180px_140px]"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">権限</Label>
              <select
                id="role"
                name="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="staff"
              >
                <option value="admin">管理者</option>
                <option value="staff">スタッフ</option>
                <option value="teacher">講師</option>
                <option value="student">受講者</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Mail className="mr-1 h-4 w-4" /> 招待を送る
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>招待一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="まだ招待はありません"
              description="上のフォームから1件目の招待を作成しましょう。"
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {rows.map((r) => {
                const link = `${baseUrl}/invite/${r.token}`;
                return (
                  <li key={r.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.email}</span>
                      <Badge variant="secondary">{r.role}</Badge>
                      <Badge
                        variant={
                          r.status === "accepted"
                            ? "success"
                            : r.status === "revoked"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        作成 {formatDateTime(r.created_at)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>有効期限: {formatDateTime(r.expires_at)}</span>
                      <span>·</span>
                      <a
                        href={link}
                        className="break-all text-primary hover:underline"
                      >
                        {link}
                      </a>
                    </div>
                    {r.status === "pending" && (
                      <form action={revokeInvitation} className="mt-2">
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          取り消す
                        </Button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
