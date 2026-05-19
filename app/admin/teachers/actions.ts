"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTeacher(formData: FormData): Promise<void> {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const payload = {
    name,
    email: String(formData.get("email") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    active: formData.get("active") === "on",
  };
  await supabase.from("teachers").insert(payload);
  revalidatePath("/admin/teachers");
}

export async function deleteTeacher(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("teachers").delete().eq("id", id);
  revalidatePath("/admin/teachers");
}
