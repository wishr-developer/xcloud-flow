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
import { createFaq, deleteFaq } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const supabase = createClient();
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .order("category", { ascending: true })
    .order("order_index", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FAQ 管理</h1>
        <p className="text-sm text-muted-foreground">
          顧客サイト「よくある質問」に表示する項目を管理します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規 FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFaq} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="question">質問</Label>
                <Input id="question" name="question" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">カテゴリ</Label>
                <Input id="category" name="category" placeholder="例: 決済について" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="answer">回答</Label>
              <Textarea id="answer" name="answer" rows={4} required />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order_index">並び順 (小さいほど上)</Label>
                <Input
                  id="order_index"
                  name="order_index"
                  type="number"
                  defaultValue={0}
                  className="w-32"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked
                  className="h-4 w-4 rounded border-input"
                />
                公開する
              </label>
            </div>
            <Button type="submit">追加</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>一覧 ({faqs?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {faqs && faqs.length > 0 ? (
            <ul className="space-y-3">
              {faqs.map((f) => (
                <li key={f.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {f.category && (
                        <Badge variant="secondary" className="mb-1">
                          {f.category}
                        </Badge>
                      )}
                      <div className="font-medium">Q. {f.question}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        A. {f.answer}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={f.published ? "success" : "secondary"}>
                        {f.published ? "公開中" : "非公開"}
                      </Badge>
                      <form
                        action={async () => {
                          "use server";
                          await deleteFaq(f.id);
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              FAQ はまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
