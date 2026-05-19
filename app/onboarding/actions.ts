"use server";

import { createClient } from "@/lib/supabase/server";
import { ALL_BUSINESS_TYPES, getBusinessTemplate } from "@/lib/business-templates";
import type { BusinessType } from "@/lib/types";
import { audit } from "@/lib/audit";

interface OnboardingResult {
  ok: boolean;
  redirect?: string;
  error?: string;
}

export async function saveOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "ログインが必要です" };
  }

  const raw = String(formData.get("business_type") ?? "multi");
  const business_type: BusinessType = (
    ALL_BUSINESS_TYPES as readonly string[]
  ).includes(raw)
    ? (raw as BusinessType)
    : "multi";
  const template = getBusinessTemplate(business_type);

  const name = String(formData.get("name") ?? "").trim() || "新しいスクール";
  const tagline = String(formData.get("tagline") ?? "").trim() || template.heroCopy;
  const primary_color = String(formData.get("primary_color") ?? "#4F46E5");
  const logo_url = String(formData.get("logo_url") ?? "").trim() || null;
  const slugRaw = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slug =
    slugRaw.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") ||
    `org-${user.id.slice(0, 8)}`;

  // Locate or create the organization for this user
  let orgId: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    orgId = (profile as { organization_id?: string | null } | null)
      ?.organization_id ?? null;
  } catch {
    orgId = null;
  }

  if (!orgId) {
    // Create a fresh org if the user somehow doesn't have one.
    const { data: newOrg, error } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        business_type,
        plan: "free",
        owner_id: user.id,
        primary_color,
        logo_url,
        tagline,
        onboarding_completed: true,
      })
      .select("id")
      .single();
    if (error || !newOrg) {
      return { ok: false, error: "組織の作成に失敗しました: " + (error?.message ?? "") };
    }
    orgId = (newOrg as { id: string }).id;
    await supabase
      .from("profiles")
      .update({ organization_id: orgId, role: "admin" })
      .eq("id", user.id);
  } else {
    // Update existing org
    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        slug,
        business_type,
        primary_color,
        logo_url,
        tagline,
        onboarding_completed: true,
      })
      .eq("id", orgId);
    if (error) {
      return { ok: false, error: "組織の更新に失敗しました: " + error.message };
    }
  }

  // Also sync to global site_config (best-effort)
  try {
    await supabase.from("site_config").upsert(
      {
        id: 1,
        product_name: name,
        business_type,
        service_label: template.serviceLabel,
        instructor_label: template.instructorLabel,
        participant_label: template.participantLabel,
        schedule_label: template.scheduleLabel,
        primary_color,
        hero_copy: tagline,
        chat_opening_message: template.chatOpeningMessage,
        sample_categories: template.sampleCategories,
      },
      { onConflict: "id" }
    );
  } catch {
    // ignore
  }

  // Optional: create first lesson
  const lessonTitle = String(formData.get("lesson_title") ?? "").trim();
  if (lessonTitle) {
    const price = Number(formData.get("lesson_price") ?? 0) || 0;
    const duration = Number(formData.get("lesson_duration") ?? 60) || 60;
    try {
      await supabase.from("lessons").insert({
        title: lessonTitle,
        price,
        duration_minutes: duration,
        capacity: 8,
        active: true,
        organization_id: orgId,
      });
    } catch {
      // ignore — schema may be slightly different
    }
  }

  // Optional: create first teacher
  const teacherName = String(formData.get("teacher_name") ?? "").trim();
  if (teacherName) {
    const teacherEmail = String(formData.get("teacher_email") ?? "").trim() || null;
    try {
      await supabase.from("teachers").insert({
        name: teacherName,
        email: teacherEmail,
        active: true,
        organization_id: orgId,
      });
    } catch {
      // ignore
    }
  }

  await audit({
    organization_id: orgId,
    actor_id: user.id,
    actor_email: user.email ?? null,
    category: "organization",
    action: "onboarding_completed",
    target_type: "organizations",
    target_id: orgId,
    meta: { business_type, slug, name },
  });

  // Best-effort: create one starter booking_slot for tomorrow if a lesson was added.
  if (lessonTitle) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().slice(0, 10);
      const { data: lesson } = await supabase
        .from("lessons")
        .select("id,price,duration_minutes")
        .eq("organization_id", orgId)
        .eq("title", lessonTitle)
        .maybeSingle();
      const l = lesson as { id?: string; price?: number; duration_minutes?: number } | null;
      if (l?.id) {
        await supabase.from("booking_slots").insert({
          organization_id: orgId,
          lesson_id: l.id,
          date: isoDate,
          start_time: "10:00:00",
          end_time:
            l.duration_minutes && l.duration_minutes <= 120
              ? new Date(
                  Date.UTC(2000, 0, 1, 10, 0) +
                    (l.duration_minutes ?? 60) * 60 * 1000
                )
                  .toISOString()
                  .slice(11, 19)
              : "11:00:00",
          capacity: 8,
          booked_count: 0,
          price: l.price ?? 0,
          status: "open",
        });
      }
    } catch {
      // ignore — schema variance
    }
  }

  return { ok: true, redirect: "/onboarding/done" };
}
