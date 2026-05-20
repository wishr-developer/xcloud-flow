import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/site-shell";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const revalidate = 600;

export default async function AnnouncementDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: a } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", params.id)
    .eq("published", true)
    .maybeSingle();
  if (!a) notFound();

  return (
    <SiteShell skipAuth>
      <article className="container max-w-3xl py-10">
        <div className="text-xs text-muted-foreground">
          {formatDate(a.published_at)}
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{a.title}</h1>
        {a.pinned && (
          <Badge variant="warning" className="mt-3">
            固定
          </Badge>
        )}
        <div className="prose prose-slate mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {a.body}
        </div>
        <div className="mt-10">
          <Button asChild variant="outline">
            <Link href="/announcements">← 一覧へ戻る</Link>
          </Button>
        </div>
      </article>
    </SiteShell>
  );
}
