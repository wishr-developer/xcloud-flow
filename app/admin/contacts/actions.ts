"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setContactStatus(
  id: string,
  status: "new" | "responded" | "closed"
): Promise<void> {
  const supabase = createClient();
  await supabase.from("contacts").update({ status }).eq("id", id);
  revalidatePath("/admin/contacts");
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/admin/contacts");
}
