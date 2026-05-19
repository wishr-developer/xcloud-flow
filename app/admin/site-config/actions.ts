"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveSiteConfig(formData: FormData): Promise<void> {
  const supabase = createClient();
  const allowedBusiness = [
    "multi",
    "learning",
    "sports",
    "cooking",
    "music",
    "language",
    "dance",
    "yoga",
    "fitness",
    "art",
    "business",
    "other",
  ] as const;
  const business_type = String(formData.get("business_type") ?? "multi");
  const safeBiz = (allowedBusiness as readonly string[]).includes(business_type)
    ? business_type
    : "multi";
  await supabase
    .from("site_config")
    .upsert(
      {
        id: 1,
        product_name: String(formData.get("product_name") ?? "XCloud-Flow").trim(),
        business_type: safeBiz,
        service_label: String(formData.get("service_label") ?? "レッスン").trim(),
        instructor_label: String(formData.get("instructor_label") ?? "講師").trim(),
        participant_label: String(formData.get("participant_label") ?? "受講者").trim(),
        schedule_label: String(formData.get("schedule_label") ?? "予約枠").trim(),
        primary_color: String(formData.get("primary_color") ?? "#4F46E5"),
        timezone: String(formData.get("timezone") ?? "Asia/Tokyo"),
        currency: String(formData.get("currency") ?? "JPY"),
        locale: String(formData.get("locale") ?? "ja"),
      },
      { onConflict: "id" }
    );
  revalidatePath("/admin/site-config");
  revalidatePath("/");
  revalidatePath("/book/chat");
}
