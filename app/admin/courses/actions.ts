"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ぁ-んァ-ヶー一-龯]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCourse(formData: FormData): Promise<void> {
  const supabase = createClient();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(title);
  await supabase.from("courses").insert({
    slug,
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || null,
    level: (String(formData.get("level") ?? "beginner") as
      | "beginner"
      | "intermediate"
      | "advanced"),
    price: Number(formData.get("price") ?? 0),
    sale_price: formData.get("sale_price")
      ? Number(formData.get("sale_price"))
      : null,
    instructor_id: String(formData.get("instructor_id") ?? "") || null,
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
  });
  revalidatePath("/admin/courses");
}

export async function updateCourse(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("courses")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      level: String(formData.get("level") ?? "beginner") as
        | "beginner"
        | "intermediate"
        | "advanced",
      price: Number(formData.get("price") ?? 0),
      sale_price: formData.get("sale_price")
        ? Number(formData.get("sale_price"))
        : null,
      instructor_id: String(formData.get("instructor_id") ?? "") || null,
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
    })
    .eq("id", id);
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/admin/courses");
}

export async function createModule(
  courseId: string,
  formData: FormData
): Promise<void> {
  const supabase = createClient();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const { count } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  await supabase.from("course_modules").insert({
    course_id: courseId,
    title,
    order_index: count ?? 0,
  });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteModule(
  courseId: string,
  moduleId: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from("course_modules").delete().eq("id", moduleId);
  await supabase.rpc("refresh_course_aggregates", { p_course: courseId });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLessonInModule(
  courseId: string,
  moduleId: string,
  formData: FormData
): Promise<void> {
  const supabase = createClient();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const { count } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);
  await supabase.from("course_lessons").insert({
    module_id: moduleId,
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    content: String(formData.get("content") ?? "").trim() || null,
    duration_seconds: Number(formData.get("duration_seconds") ?? 0),
    preview: formData.get("preview") === "on",
    order_index: count ?? 0,
  });
  await supabase.rpc("refresh_course_aggregates", { p_course: courseId });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteLesson(
  courseId: string,
  lessonId: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from("course_lessons").delete().eq("id", lessonId);
  await supabase.rpc("refresh_course_aggregates", { p_course: courseId });
  revalidatePath(`/admin/courses/${courseId}`);
}
