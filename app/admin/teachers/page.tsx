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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTeacher, deleteTeacher } from "./actions";
import type { Teacher } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const supabase = createClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">講師管理</h1>
        <p className="text-sm text-muted-foreground">
          講師・セラピスト・スタッフを登録します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規講師を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTeacher} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">名前</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">メール</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="bio">プロフィール</Label>
              <Textarea id="bio" name="bio" rows={3} />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="active"
                name="active"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="active">在籍中</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">追加</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>講師一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers && teachers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>プロフィール</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teachers as Teacher[]).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.email ?? "-"}</TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">
                      {t.bio ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.active ? "success" : "secondary"}>
                        {t.active ? "在籍" : "休止"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteTeacher(t.id);
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
              講師がまだ登録されていません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
