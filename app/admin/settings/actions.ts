"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData): Promise<void> {
  const supabase = createClient();
  const line = String(formData.get("line_webhook_url") ?? "").trim() || null;
  const stripe = String(formData.get("stripe_price_id") ?? "").trim() || null;

  await supabase.from("app_settings").upsert([
    { key: "line_webhook_url", value: line },
    { key: "stripe_price_id", value: stripe },
  ]);
  revalidatePath("/admin/settings");
}

export async function promoteToAdmin(formData: FormData): Promise<void> {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  await supabase.from("profiles").update({ role: "admin" }).eq("email", email);
  revalidatePath("/admin/settings");
}
