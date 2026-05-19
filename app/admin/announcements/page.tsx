import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { createAnnouncement, deleteAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">お知らせ管理</h1>
        <p className="text-sm text-muted-foreground">
          顧客サイトの「お知らせ」ページに表示される投稿を管理します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規お知らせ</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAnnouncement} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">本文</Label>
              <Textarea id="body" name="body" rows={5} required />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked
                  className="h-4 w-4 rounded border-input"
                />
                公開する
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="pinned"
                  className="h-4 w-4 rounded border-input"
                />
                固定表示
              </label>
            </div>
            <Button type="submit">投稿</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>一覧 ({items?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{a.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(a.published_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.published ? "success" : "secondary"}>
                        {a.published ? "公開中" : "非公開"}
                      </Badge>
                      {a.pinned && <Badge variant="warning">固定</Badge>}
                      <form
                        action={async () => {
                          "use server";
                          await deleteAnnouncement(a.id);
                        }}
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          削除
                        </Button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {a.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              お知らせはまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
