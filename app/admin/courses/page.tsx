import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createCourse, deleteCourse } from "./actions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const supabase = createClient();
  const [{ data: courses }, { data: teachers }] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("teachers").select("id,name").eq("active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">講座管理</h1>
        <p className="text-sm text-muted-foreground">
          オンデマンド講座を作成・編集します。詳細を開くとセクション/レッスンを追加できます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規講座を作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCourse} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">スラッグ (省略可)</Label>
              <Input id="slug" name="slug" placeholder="例: cloud-101" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">カテゴリ</Label>
              <Input id="category" name="category" placeholder="例: クラウド" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="subtitle">サブタイトル</Label>
              <Input id="subtitle" name="subtitle" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">説明</Label>
              <Textarea id="description" name="description" rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">レベル</Label>
              <select
                id="level"
                name="level"
                defaultValue="beginner"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructor_id">講師</Label>
              <select
                id="instructor_id"
                name="instructor_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">未指定</option>
                {(teachers ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">通常価格 (円)</Label>
              <Input id="price" name="price" type="number" min={0} defaultValue={19800} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price">セール価格 (任意)</Label>
              <Input id="sale_price" name="sale_price" type="number" min={0} />
            </div>
            <div className="flex items-center gap-4 md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  name="published"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-input"
                />
                公開する
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  name="featured"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                注目に表示
              </label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">作成</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>講座一覧 ({courses?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {courses && courses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>レベル</TableHead>
                  <TableHead>価格</TableHead>
                  <TableHead>レッスン数</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className="hover:underline"
                        >
                          {c.title}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">/{c.slug}</div>
                    </TableCell>
                    <TableCell>{c.category ?? "-"}</TableCell>
                    <TableCell>{c.level}</TableCell>
                    <TableCell>
                      {c.sale_price ? (
                        <span>
                          <span className="font-semibold text-rose-600">
                            {formatCurrency(c.sale_price)}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground line-through">
                            {formatCurrency(c.price)}
                          </span>
                        </span>
                      ) : (
                        formatCurrency(c.price)
                      )}
                    </TableCell>
                    <TableCell>{c.lesson_count}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={c.published ? "success" : "secondary"}>
                          {c.published ? "公開中" : "下書き"}
                        </Badge>
                        {c.featured && <Badge variant="warning">注目</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/courses/${c.id}`}>編集</Link>
                      </Button>
                      <form
                        className="inline"
                        action={async () => {
                          "use server";
                          await deleteCourse(c.id);
                        }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          削除
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              講座がまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
