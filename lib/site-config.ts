import { createClient } from "@/lib/supabase/server";
import type { SiteConfig, BusinessType } from "@/lib/types";

export const DEFAULT_SITE_CONFIG: SiteConfig = {
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
};

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_SITE_CONFIG;
    return data as SiteConfig;
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

/**
 * Industry-aware chat assistant copy.
 */
export function chatGreeting(cfg: SiteConfig): string {
  const m: Record<BusinessType, string> = {
    multi:
      "こんにちは！XCloud-Flow アシスタントです。ご希望の" +
      cfg.service_label +
      "と日時をうかがいながら、空き" +
      cfg.schedule_label +
      "をご提案します。",
    learning:
      "こんにちは！受講をご希望ですね。学びたい科目とご都合の良い時間帯を教えてください。",
    sports:
      "ようこそ！スポーツスクールの体験予約を承ります。種目とご希望日時を教えてください。",
    cooking:
      "ようこそ！料理教室の予約を承ります。学びたいジャンルと日時を教えてください。",
    music:
      "こんにちは！音楽教室の体験予約を承ります。楽器と希望日時を教えてください。",
    language:
      "Hello! 語学レッスンのご予約を承ります。レベルと希望の曜日・時間をお知らせください。",
    dance:
      "ようこそ！ダンスレッスンの予約を承ります。ジャンルと希望日時を教えてください。",
    yoga:
      "ようこそ！ヨガクラスのご予約ですね。初心者向け / 経験者向け、ご希望の時間帯を教えてください。",
    fitness:
      "ようこそ！フィットネスセッションの予約を承ります。希望種目と時間帯を教えてください。",
    art:
      "ようこそ！アートクラスの予約を承ります。挑戦したい技法と日時を教えてください。",
    business:
      "ようこそ。ビジネス研修のご予約を承ります。テーマとご希望日時をお知らせください。",
    other:
      "こんにちは！ご希望の予約内容と日時を教えてください。",
  };
  return m[cfg.business_type] ?? m.multi;
}
