"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ALL_BUSINESS_TYPES, getBusinessTemplate } from "@/lib/business-templates";
import type { BusinessType } from "@/lib/types";

export async function saveSiteConfig(formData: FormData): Promise<void> {
  const supabase = createClient();
  const raw = String(formData.get("business_type") ?? "multi");
  const business_type: BusinessType = (
    ALL_BUSINESS_TYPES as readonly string[]
  ).includes(raw)
    ? (raw as BusinessType)
    : "multi";
  const t = getBusinessTemplate(business_type);

  const pick = (key: string, fallback: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || fallback;
  };
  const pickNullable = (key: string, fallback: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || fallback;
  };

  const sampleRaw = String(formData.get("sample_categories") ?? "").trim();
  const sample_categories =
    sampleRaw.length > 0
      ? sampleRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : t.sampleCategories;

  await supabase.from("site_config").upsert(
    {
      id: 1,
      product_name: pick("product_name", "XCloud-Flow"),
      business_type,
      service_label: pick("service_label", t.serviceLabel),
      instructor_label: pick("instructor_label", t.instructorLabel),
      participant_label: pick("participant_label", t.participantLabel),
      schedule_label: pick("schedule_label", t.scheduleLabel),
      primary_color: pick("primary_color", "#4F46E5"),
      timezone: pick("timezone", "Asia/Tokyo"),
      currency: pick("currency", "JPY"),
      locale: pick("locale", "ja"),
      hero_copy: pickNullable("hero_copy", t.heroCopy),
      chat_opening_message: pickNullable(
        "chat_opening_message",
        t.chatOpeningMessage
      ),
      sample_categories,
    },
    { onConflict: "id" }
  );

  revalidatePath("/admin/site-config");
  revalidatePath("/");
  revalidatePath("/book/chat");
  revalidatePath("/pricing");
}
