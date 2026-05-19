import { createClient } from "@/lib/supabase/server";
import type { SiteConfig } from "@/lib/types";
import { getBusinessTemplate } from "@/lib/business-templates";

const baseDefault: SiteConfig = {
  id: 1,
  product_name: "XCloud-Flow",
  business_type: "multi",
  service_label: "レッスン",
  instructor_label: "講師",
  participant_label: "受講者",
  schedule_label: "予約枠",
  primary_color: "#4F46E5",
  timezone: "Asia/Tokyo",
  currency: "JPY",
  locale: "ja",
  updated_at: new Date().toISOString(),
  hero_copy: null,
  chat_opening_message: null,
  sample_categories: null,
};

function applyTemplateDefaults(cfg: SiteConfig): SiteConfig {
  const t = getBusinessTemplate(cfg.business_type);
  return {
    ...cfg,
    service_label: cfg.service_label || t.serviceLabel,
    instructor_label: cfg.instructor_label || t.instructorLabel,
    participant_label: cfg.participant_label || t.participantLabel,
    schedule_label: cfg.schedule_label || t.scheduleLabel,
    hero_copy: cfg.hero_copy ?? t.heroCopy,
    chat_opening_message: cfg.chat_opening_message ?? t.chatOpeningMessage,
    sample_categories:
      cfg.sample_categories && cfg.sample_categories.length > 0
        ? cfg.sample_categories
        : t.sampleCategories,
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = applyTemplateDefaults(baseDefault);

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_SITE_CONFIG;
    return applyTemplateDefaults({ ...baseDefault, ...(data as SiteConfig) });
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

/** Industry-aware chat assistant copy (kept for backwards-compatibility). */
export function chatGreeting(cfg: SiteConfig): string {
  return (
    cfg.chat_opening_message ??
    getBusinessTemplate(cfg.business_type).chatOpeningMessage
  );
}
