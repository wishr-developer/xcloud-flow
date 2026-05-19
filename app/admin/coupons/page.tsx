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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { createCoupon, toggleCouponActive, deleteCoupon } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const supabase = createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">クーポン管理</h1>
        <p className="text-sm text-muted-foreground">
          講座受講時に利用できる割引クーポンを発行・管理します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規クーポンを発行</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCoupon} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">コード</Label>
              <Input
                id="code"
                name="code"
                required
                placeholder="例: WELCOME20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_type">種類</Label>
              <select
                id="discount_type"
                name="discount_type"
                defaultValue="percent"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="percent">パーセント (%)</option>
                <option value="fixed">固定額 (円)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_value">値</Label>
              <Input
                id="discount_value"
                name="discount_value"
                type="number"
                min={0}
                defaultValue={10}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">説明</Label>
              <Input id="description" name="description" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_uses">最大利用回数</Label>
              <Input
                id="max_uses"
                name="max_uses"
                type="number"
                min={1}
                placeholder="無制限なら空欄"
              />
            </div>
            <div className="flex items-center md:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="h-4 w-4 rounded border-input"
                />
                有効化する
              </label>
            </div>
            <div className="md:col-span-3">
              <Button type="submit">発行</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>一覧 ({coupons?.length ?? 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons && coupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>割引</TableHead>
                  <TableHead>利用回数</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">
                      {c.code}
                    </TableCell>
                    <TableCell>
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : formatCurrency(c.discount_value)}
                    </TableCell>
                    <TableCell>
                      {c.used_count} / {c.max_uses ?? "∞"}
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">
                      {c.description ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "success" : "secondary"}>
                        {c.active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <form
                        className="inline"
                        action={async () => {
                          "use server";
                          await toggleCouponActive(c.id, c.active);
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          {c.active ? "無効化" : "有効化"}
                        </Button>
                      </form>
                      <form
                        className="inline"
                        action={async () => {
                          "use server";
                          await deleteCoupon(c.id);
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              クーポンはまだありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
