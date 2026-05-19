"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createFaq(formData: FormData): Promise<void> {
  const supabase = createClient();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;
  await supabase.from("faqs").insert({
    question,
    answer,
    category: String(formData.get("category") ?? "").trim() || null,
    order_index: Number(formData.get("order_index") ?? 0),
    published: formData.get("published") === "on",
  });
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

export async function deleteFaq(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("faqs").delete().eq("id", id);
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}
