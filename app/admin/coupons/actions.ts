"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCoupon(formData: FormData): Promise<void> {
  const supabase = createClient();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return;
  await supabase.from("coupons").insert({
    code,
    description: String(formData.get("description") ?? "").trim() || null,
    discount_type: String(formData.get("discount_type") ?? "percent") as
      | "percent"
      | "fixed",
    discount_value: Number(formData.get("discount_value") ?? 0),
    max_uses: formData.get("max_uses")
      ? Number(formData.get("max_uses"))
      : null,
    active: formData.get("active") === "on",
  });
  revalidatePath("/admin/coupons");
}

export async function toggleCouponActive(
  id: string,
  current: boolean
): Promise<void> {
  const supabase = createClient();
  await supabase.from("coupons").update({ active: !current }).eq("id", id);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/admin/coupons");
}
