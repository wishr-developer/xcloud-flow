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
import { createLocation, toggleLocation, deleteLocation } from "./actions";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

interface LocationRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  online: boolean;
  active: boolean;
}

export default async function AdminLocationsPage() {
  const supabase = createClient();
  let rows: LocationRow[] = [];
  try {
    const { data } = await supabase
      .from("locations")
      .select("id,name,address,phone,email,timezone,online,active")
      .order("created_at", { ascending: false });
    rows = (data as LocationRow[] | null) ?? [];
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">拠点</h1>
        <p className="text-sm text-muted-foreground">
          複数教室・複数拠点・フランチャイズ運営に対応する拠点情報を管理します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規拠点を追加</CardTitle>
          <CardDescription>
            拠点ごとに住所・電話・タイムゾーンを設定できます。「オンライン」を有効にすると、オンライン専用スタジオとして扱えます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLocation} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">拠点名</Label>
              <Input id="name" name="name" required placeholder="例: 表参道スタジオ" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">住所</Label>
              <Input id="address" name="address" placeholder="東京都渋谷区..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">電話</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">メール</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">タイムゾーン</Label>
              <Input id="timezone" name="timezone" defaultValue="Asia/Tokyo" />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="online"
                  value="1"
                  className="h-4 w-4"
                />
                オンライン拠点
              </label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">
                <MapPin className="mr-1 h-4 w-4" /> 拠点を追加
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>拠点一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="まだ拠点が登録されていません"
              description="最初の拠点を登録すると、予約枠に拠点を紐付けられるようになります。"
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {rows.map((l) => (
                <li key={l.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={l.active ? "default" : "secondary"}>
                      {l.active ? "active" : "inactive"}
                    </Badge>
                    {l.online && <Badge variant="success">online</Badge>}
                    <span className="font-medium">{l.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {l.timezone ?? "Asia/Tokyo"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {l.address ?? "—"}
                    {l.phone ? ` · ${l.phone}` : ""}
                    {l.email ? ` · ${l.email}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={toggleLocation}>
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={l.active ? "false" : "true"}
                      />
                      <Button size="sm" variant="outline">
                        {l.active ? "停止する" : "再開する"}
                      </Button>
                    </form>
                    <form action={deleteLocation}>
                      <input type="hidden" name="id" value={l.id} />
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
