"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createLesson(formData: FormData): Promise<void> {
  const supabase = createClient();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const payload = {
    title,
    description: (String(formData.get("description") ?? "").trim() || null) as
      | string
      | null,
    duration_minutes: Number(formData.get("duration_minutes") ?? 60),
    price: Number(formData.get("price") ?? 0),
    capacity: Number(formData.get("capacity") ?? 1),
    active: formData.get("active") === "on",
  };
  await supabase.from("lessons").insert(payload);
  revalidatePath("/admin/lessons");
}

export async function deleteLesson(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("lessons").delete().eq("id", id);
  revalidatePath("/admin/lessons");
}
