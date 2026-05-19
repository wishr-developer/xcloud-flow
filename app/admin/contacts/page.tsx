import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { setContactStatus, deleteContact } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">お問い合わせ一覧</h1>
        <p className="text-sm text-muted-foreground">
          公開サイトのお問い合わせフォームから届いた内容です。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>受信ボックス ({items?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((c) => (
                <li key={c.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {c.name}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({c.email}
                          {c.phone ? ` / ${c.phone}` : ""})
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(c.created_at)}{" "}
                        {c.subject ? `· ${c.subject}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          c.status === "new"
                            ? "warning"
                            : c.status === "responded"
                              ? "success"
                              : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                      <form
                        className="inline"
                        action={async () => {
                          "use server";
                          await setContactStatus(
                            c.id,
                            c.status === "new" ? "responded" : "closed"
                          );
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          {c.status === "new" ? "対応中にする" : "クローズ"}
                        </Button>
                      </form>
                      <form
                        className="inline"
                        action={async () => {
                          "use server";
                          await deleteContact(c.id);
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
                  <p className="mt-3 whitespace-pre-wrap text-sm">{c.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              お問い合わせはまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
