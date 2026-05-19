import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LearnLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, order_index, lessons:course_lessons(id, order_index)")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });

  const firstLesson = (modules ?? [])
    .flatMap((m) =>
      ((m.lessons as Array<{ id: string; order_index: number }>) ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
    )[0];

  if (!firstLesson) {
    redirect(`/courses/${course.slug}`);
  }
  redirect(`/courses/${course.slug}/learn/${firstLesson.id}`);
}
