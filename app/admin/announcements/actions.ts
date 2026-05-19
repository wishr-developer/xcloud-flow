"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAnnouncement(formData: FormData): Promise<void> {
  const supabase = createClient();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await supabase.from("announcements").insert({
    title,
    body,
    pinned: formData.get("pinned") === "on",
    published: formData.get("published") === "on",
    published_at: new Date().toISOString(),
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}
