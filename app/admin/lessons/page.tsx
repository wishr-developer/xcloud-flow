import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
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
import { createLesson, deleteLesson } from "./actions";
import type { Lesson } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const supabase = createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">レッスン管理</h1>
        <p className="text-sm text-muted-foreground">
          メニュー (コース・レッスン) を作成・編集します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規レッスンを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLesson} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">説明</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration_minutes">所要時間 (分)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={5}
                defaultValue={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">価格 (円)</Label>
              <Input id="price" name="price" type="number" min={0} defaultValue={3000} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">定員</Label>
              <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="active"
                name="active"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="active">公開する</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">追加</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>レッスン一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {lessons && lessons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>価格</TableHead>
                  <TableHead>定員</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lessons as Lesson[]).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell>{l.duration_minutes}分</TableCell>
                    <TableCell>{formatCurrency(l.price)}</TableCell>
                    <TableCell>{l.capacity}名</TableCell>
                    <TableCell>
                      <Badge variant={l.active ? "success" : "secondary"}>
                        {l.active ? "公開" : "非公開"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteLesson(l.id);
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
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
              レッスンがまだありません。上のフォームから追加してください。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
