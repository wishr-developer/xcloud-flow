import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/site-shell";
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
import { CheckCircle2, Clock, PlayCircle, Star, User } from "lucide-react";
import Link from "next/link";
import { EnrollButton } from "./enroll-button";

export const revalidate = 600;

const LEVEL: Record<string, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(
      "*, instructor:instructor_id(name,bio,email)"
    )
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id,title,order_index,lessons:course_lessons(id,title,duration_seconds,preview,order_index)")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });

  const sortedModules = (modules ?? []).map((m) => ({
    ...m,
    lessons: ((m.lessons as Array<{
      id: string;
      title: string;
      duration_seconds: number;
      preview: boolean;
      order_index: number;
    }>) ?? []).slice().sort((a, b) => a.order_index - b.order_index),
  }));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existingEnrollment } = user
    ? await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const instructor = course.instructor as
    | { name?: string; bio?: string; email?: string }
    | null;

  const effectivePrice = course.sale_price ?? course.price;
  const totalLessons = sortedModules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  return (
    <SiteShell skipAuth>
      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-8 text-white">
              <div className="flex flex-wrap items-center gap-2">
                {course.category && (
                  <Badge variant="secondary" className="bg-white/15 text-white">
                    {course.category}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/15 text-white">
                  {LEVEL[course.level] ?? course.level}
                </Badge>
                {course.featured && (
                  <Badge variant="secondary" className="bg-amber-300 text-amber-900">
                    注目
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="mt-2 text-white/80">{course.subtitle}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  約 {Math.max(1, course.duration_minutes)}分
                </span>
                <span className="inline-flex items-center gap-1">
                  <PlayCircle className="h-4 w-4" />
                  {totalLessons}レッスン
                </span>
                {course.rating_count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {course.rating_avg.toFixed(1)} ({course.rating_count})
                  </span>
                )}
              </div>
            </div>

            <section className="mt-8">
              <h2 className="text-xl font-bold tracking-tight">この講座について</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {course.description ?? ""}
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-bold tracking-tight">カリキュラム</h2>
              {sortedModules.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {sortedModules.map((m, idx) => (
                    <details
                      key={m.id}
                      open={idx === 0}
                      className="group rounded-md border bg-white"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium">
                        <span>{m.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.lessons.length}本
                        </span>
                      </summary>
                      <ul className="divide-y border-t text-sm">
                        {m.lessons.map((l) => (
                          <li
                            key={l.id}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <span className="inline-flex items-center gap-2">
                              <PlayCircle className="h-4 w-4 text-muted-foreground" />
                              {l.title}
                            </span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              {l.preview && <Badge variant="outline">プレビュー</Badge>}
                              {Math.round(l.duration_seconds / 60)}分
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  カリキュラムは準備中です。
                </div>
              )}
            </section>

            {instructor && (
              <section className="mt-8">
                <h2 className="text-xl font-bold tracking-tight">講師</h2>
                <Card className="mt-3">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">{instructor.name}</div>
                      {instructor.bio && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {instructor.bio}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between gap-2">
                  {course.sale_price ? (
                    <>
                      <span className="text-3xl font-bold text-rose-600">
                        {formatCurrency(course.sale_price)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(course.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold">
                      {formatCurrency(course.price)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    無期限視聴
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    スマホ / PC 対応
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    修了で証明書を発行
                  </li>
                </ul>
                {existingEnrollment ? (
                  <>
                    <Button asChild className="w-full">
                      <Link href={`/courses/${course.slug}/learn`}>
                        受講を続ける →
                      </Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      この講座はすでに登録済みです
                    </p>
                  </>
                ) : (
                  <EnrollButton
                    courseId={course.id}
                    courseSlug={course.slug}
                    price={effectivePrice}
                    isAuthed={!!user}
                  />
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
