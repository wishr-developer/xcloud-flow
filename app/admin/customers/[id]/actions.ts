"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCustomerNotes(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = createClient();
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  await supabase.from("customers").update({ memo, tags }).eq("id", id);
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath(`/admin/customers`);
}
