import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Pin } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "お知らせ" };

export default async function AnnouncementsPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("announcements")
    .select("id,title,body,pinned,published_at")
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

  return (
    <SiteShell>
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight">お知らせ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          最新のリリース・キャンペーン情報を掲載しています。
        </p>

        <div className="mt-8 space-y-4">
          {items && items.length > 0 ? (
            items.map((a) => (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/announcements/${a.id}`}
                          className="hover:underline"
                        >
                          {a.title}
                        </Link>
                      </CardTitle>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(a.published_at)}
                      </div>
                    </div>
                    {a.pinned && (
                      <Badge variant="warning">
                        <Pin className="mr-1 h-3 w-3" />
                        固定
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="line-clamp-2 text-sm text-muted-foreground">
                  {a.body}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                お知らせはまだありません。
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
