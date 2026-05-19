import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/site/site-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PlayCircle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { CompleteLessonButton } from "./complete-button";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string };
}) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!course) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find or check enrollment for this user (or fallback to preview check)
  const { data: enrollment } = user
    ? await supabase
        .from("enrollments")
        .select("id, progress_percent, status")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select(
      "id, title, description, video_url, content, duration_seconds, preview, module_id"
    )
    .eq("id", params.lessonId)
    .maybeSingle();
  if (!lesson) notFound();

  const { data: module } = await supabase
    .from("course_modules")
    .select("id, title, course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();
  if (!module || module.course_id !== course.id) notFound();

  // Block non-enrolled, non-preview viewers
  if (!enrollment && !lesson.preview) {
    redirect(`/courses/${course.slug}`);
  }

  // All lessons in course (for sidebar)
  const { data: modules } = await supabase
    .from("course_modules")
    .select(
      "id, title, order_index, lessons:course_lessons(id, title, duration_seconds, preview, order_index)"
    )
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

  const flatLessons = sortedModules.flatMap((m) => m.lessons);
  const idx = flatLessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? flatLessons[idx - 1] : null;
  const next = idx >= 0 && idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  // Progress map
  const progressMap = new Map<string, boolean>();
  if (enrollment) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("enrollment_id", enrollment.id);
    (progress ?? []).forEach((p) => progressMap.set(p.lesson_id, p.completed));
  }

  const completed = progressMap.get(lesson.id) === true;

  return (
    <SiteShell>
      <div className="container py-8">
        <div className="mb-4 text-xs text-muted-foreground">
          <Link href="/courses" className="hover:underline">
            講座
          </Link>{" "}
          /{" "}
          <Link href={`/courses/${course.slug}`} className="hover:underline">
            {course.title}
          </Link>{" "}
          / {lesson.title}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video w-full bg-slate-900">
                  {lesson.video_url ? (
                    <video
                      src={lesson.video_url}
                      controls
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-white">
                      <PlayCircle className="h-14 w-14 opacity-50" />
                      <span className="text-sm opacity-80">
                        動画は準備中です (テキスト教材をご覧ください)
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {lesson.title}
                    </h1>
                    {completed && (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        完了
                      </Badge>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                  )}

                  {lesson.content && (
                    <article className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {lesson.content}
                    </article>
                  )}

                  {enrollment && (
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <CompleteLessonButton
                        enrollmentId={enrollment.id}
                        lessonId={lesson.id}
                        initialCompleted={completed}
                        nextHref={
                          next
                            ? `/courses/${course.slug}/learn/${next.id}`
                            : undefined
                        }
                      />
                      <div className="flex gap-2">
                        {prev && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/courses/${course.slug}/learn/${prev.id}`}>
                              <ChevronLeft className="mr-1 h-4 w-4" />
                              前のレッスン
                            </Link>
                          </Button>
                        )}
                        {next && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/courses/${course.slug}/learn/${next.id}`}>
                              次のレッスン
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {!enrollment && lesson.preview && (
                    <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      これはプレビューレッスンです。すべてのレッスンを受講するには、
                      <Link
                        href={`/courses/${course.slug}`}
                        className="ml-1 font-semibold underline"
                      >
                        受講登録
                      </Link>
                      してください。
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  カリキュラム
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedModules.map((m) => (
                  <div key={m.id}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {m.title}
                    </div>
                    <ul className="space-y-1">
                      {m.lessons.map((l) => {
                        const isCurrent = l.id === lesson.id;
                        const isDone = progressMap.get(l.id) === true;
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/courses/${course.slug}/learn/${l.id}`}
                              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                                isCurrent
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <span className="line-clamp-1 flex items-center gap-2">
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                {l.title}
                              </span>
                              <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                {Math.round(l.duration_seconds / 60)}分
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
