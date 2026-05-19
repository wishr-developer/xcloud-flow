import Link from "next/link";
import { notFound } from "next/navigation";
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
import {
  updateCourse,
  createModule,
  deleteModule,
  createLessonInModule,
  deleteLesson,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCourseEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: course }, { data: teachers }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("teachers").select("id,name").eq("active", true),
  ]);
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id,title,order_index, lessons:course_lessons(id,title,duration_seconds,preview,order_index)")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-sm text-muted-foreground">スラッグ: /{course.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/courses">← 一覧へ戻る</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/courses/${course.slug}`} target="_blank">
              プレビュー
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (fd) => {
              "use server";
              await updateCourse(course.id, fd);
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" name="title" defaultValue={course.title} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="subtitle">サブタイトル</Label>
              <Input id="subtitle" name="subtitle" defaultValue={course.subtitle ?? ""} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={course.description ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">カテゴリ</Label>
              <Input
                id="category"
                name="category"
                defaultValue={course.category ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">レベル</Label>
              <select
                id="level"
                name="level"
                defaultValue={course.level}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">通常価格</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                defaultValue={course.price}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price">セール価格</Label>
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                min={0}
                defaultValue={course.sale_price ?? ""}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="instructor_id">講師</Label>
              <select
                id="instructor_id"
                name="instructor_id"
                defaultValue={course.instructor_id ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">未指定</option>
                {(teachers ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={course.published}
                  className="h-4 w-4 rounded border-input"
                />
                公開する
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={course.featured}
                  className="h-4 w-4 rounded border-input"
                />
                注目に表示
              </label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">保存</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>カリキュラム</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(modules ?? []).map((m) => {
            const lessons = ((m.lessons as Array<{
              id: string;
              title: string;
              duration_seconds: number;
              preview: boolean;
              order_index: number;
            }>) ?? [])
              .slice()
              .sort((a, b) => a.order_index - b.order_index);
            return (
              <div key={m.id} className="rounded-md border">
                <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2">
                  <div className="text-sm font-semibold">{m.title}</div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteModule(course.id, m.id);
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      セクションを削除
                    </Button>
                  </form>
                </div>
                <ul className="divide-y">
                  {lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        {l.title}
                        {l.preview && (
                          <Badge variant="outline" className="ml-2">
                            プレビュー
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(l.duration_seconds / 60)}分
                        </span>
                        <form
                          action={async () => {
                            "use server";
                            await deleteLesson(course.id, l.id);
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
                    </li>
                  ))}
                </ul>
                <form
                  action={async (fd) => {
                    "use server";
                    await createLessonInModule(course.id, m.id, fd);
                  }}
                  className="grid gap-2 border-t bg-slate-50/50 p-4 md:grid-cols-2"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs">レッスン名</Label>
                    <Input name="title" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">時間 (秒)</Label>
                    <Input
                      name="duration_seconds"
                      type="number"
                      min={0}
                      defaultValue={300}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">説明 (任意)</Label>
                    <Input name="description" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">動画URL (任意)</Label>
                    <Input name="video_url" placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">本文 (Markdown対応プレーンテキスト)</Label>
                    <Textarea name="content" rows={3} />
                  </div>
                  <div className="flex items-center gap-2 text-xs md:col-span-2">
                    <input
                      type="checkbox"
                      name="preview"
                      className="h-4 w-4 rounded border-input"
                    />
                    プレビュー (非受講者にも公開)
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" size="sm">
                      レッスンを追加
                    </Button>
                  </div>
                </form>
              </div>
            );
          })}

          <form
            action={async (fd) => {
              "use server";
              await createModule(course.id, fd);
            }}
            className="flex items-end gap-2 rounded-md border border-dashed p-4"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="m-title">新規セクションを追加</Label>
              <Input id="m-title" name="title" placeholder="例: Section 3. ハンズオン" />
            </div>
            <Button type="submit">追加</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
