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
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { createRule, generateSlots, deleteRule } from "./actions";
import { Repeat2, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

interface RuleRow {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  capacity: number;
  price: number;
  location: string | null;
  weeks_ahead: number;
  active: boolean;
  lesson: { title?: string } | null;
  teacher: { name?: string } | null;
}

interface Option {
  id: string;
  title?: string;
  name?: string;
}

export default async function AdminRecurringPage() {
  const supabase = createClient();
  let rules: RuleRow[] = [];
  let lessons: Option[] = [];
  let teachers: Option[] = [];
  try {
    const [rulesRes, lessonsRes, teachersRes] = await Promise.all([
      supabase
        .from("recurring_rules")
        .select(
          "id,weekday,start_time,end_time,capacity,price,location,weeks_ahead,active,lesson:lesson_id(title),teacher:teacher_id(name)"
        )
        .order("weekday", { ascending: true }),
      supabase.from("lessons").select("id,title").eq("active", true).order("title"),
      supabase.from("teachers").select("id,name").eq("active", true).order("name"),
    ]);
    rules = ((rulesRes.data as unknown) as RuleRow[] | null) ?? [];
    lessons = ((lessonsRes.data as unknown) as Option[] | null) ?? [];
    teachers = ((teachersRes.data as unknown) as Option[] | null) ?? [];
  } catch {
    // tables may not exist yet
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">繰り返しクラス</h1>
        <p className="text-sm text-muted-foreground">
          毎週同じ曜日・時間に開催するクラスのルールを登録し、まとめて予約枠を生成します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規ルールを作成</CardTitle>
          <CardDescription>
            例: 毎週土曜 10:00-11:00 のヨガクラス (8人定員 / 2,800円)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createRule} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lesson_id">レッスン</Label>
              <select
                id="lesson_id"
                name="lesson_id"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">選択...</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher_id">講師</Label>
              <select
                id="teacher_id"
                name="teacher_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">未指定</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weekday">曜日</Label>
              <select
                id="weekday"
                name="weekday"
                required
                defaultValue="6"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {WEEKDAYS.map((w, i) => (
                  <option key={i} value={i}>
                    {w}曜
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_time">開始時刻</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                required
                defaultValue="10:00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">終了時刻</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                required
                defaultValue="11:00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">定員</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                defaultValue={8}
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">料金 (円)</Label>
              <Input id="price" name="price" type="number" defaultValue={3000} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weeks_ahead">先何週分まで生成</Label>
              <Input
                id="weeks_ahead"
                name="weeks_ahead"
                type="number"
                defaultValue={4}
                min={1}
                max={26}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">開催場所 (任意)</Label>
              <Input id="location" name="location" placeholder="教室 / オンラインURL" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">
                <Repeat2 className="mr-1 h-4 w-4" /> ルールを作成
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>登録済みルール</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <EmptyState
              icon={Repeat2}
              title="まだルールがありません"
              description="上のフォームから繰り返しルールを作成すると、予約枠を自動生成できます。"
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {rules.map((r) => (
                <li key={r.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{WEEKDAYS[r.weekday]}曜</Badge>
                    <span className="font-medium">{r.lesson?.title ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)} · 定員
                      {r.capacity} · ¥{r.price.toLocaleString()}
                    </span>
                    {!r.active && <Badge variant="destructive">停止中</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={generateSlots}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button size="sm" variant="outline">
                        <Calendar className="mr-1 h-3 w-3" />
                        {r.weeks_ahead}週分の枠を生成
                      </Button>
                    </form>
                    <form action={deleteRule}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button size="sm" variant="ghost">
                        削除
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
