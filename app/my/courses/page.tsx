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
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, progress_percent, status, enrolled_at, payment_status, course:course_id(slug,title,subtitle,category,level)"
    )
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email ?? ""}`)
    .order("enrolled_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">受講中の講座</CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments && enrollments.length > 0 ? (
          <ul className="space-y-3">
            {enrollments.map((e) => {
              const c = e.course as
                | {
                    slug?: string;
                    title?: string;
                    subtitle?: string;
                    category?: string;
                    level?: string;
                  }
                | null;
              const pct = Math.min(100, Math.max(0, e.progress_percent));
              return (
                <li
                  key={e.id}
                  className="rounded-md border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {c?.category && (
                          <Badge variant="secondary">{c.category}</Badge>
                        )}
                        <Badge variant="outline">
                          {e.status === "completed" ? "修了済み" : "受講中"}
                        </Badge>
                        <Badge
                          variant={
                            e.payment_status === "paid" ||
                            e.payment_status === "demo_paid" ||
                            e.payment_status === "free"
                              ? "success"
                              : "warning"
                          }
                        >
                          {e.payment_status}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{c?.title}</h3>
                      {c?.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {c.subtitle}
                        </p>
                      )}
                      <div className="mt-3">
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          進捗 {pct}% · 登録日 {formatDate(e.enrolled_at)}
                        </div>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/courses/${c?.slug}/learn`}>受講する</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            まだ受講中の講座はありません。
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/courses">講座を見る</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
