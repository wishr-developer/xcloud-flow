"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

async function resolveOrg(): Promise<{ orgId: string | null; userId: string | null; email: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { orgId: null, userId: null, email: null };
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
  return { orgId, userId: user.id, email: user.email ?? null };
}

export async function createRule(formData: FormData) {
  const supabase = createClient();
  const { orgId, userId, email } = await resolveOrg();
  const lesson_id = String(formData.get("lesson_id") ?? "");
  if (!lesson_id) return;
  await supabase.from("recurring_rules").insert({
    organization_id: orgId,
    lesson_id,
    teacher_id: String(formData.get("teacher_id") ?? "") || null,
    weekday: Number(formData.get("weekday") ?? 6),
    start_time: String(formData.get("start_time") ?? "10:00"),
    end_time: String(formData.get("end_time") ?? "11:00"),
    capacity: Number(formData.get("capacity") ?? 8),
    price: Number(formData.get("price") ?? 0),
    weeks_ahead: Number(formData.get("weeks_ahead") ?? 4),
    location: String(formData.get("location") ?? "") || null,
    active: true,
  });
  await audit({
    organization_id: orgId,
    actor_id: userId,
    actor_email: email,
    category: "admin",
    action: "recurring_create",
    target_type: "recurring_rules",
  });
  revalidatePath("/admin/recurring");
}

export async function deleteRule(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  const { orgId, userId, email } = await resolveOrg();
  await supabase.from("recurring_rules").delete().eq("id", id);
  await audit({
    organization_id: orgId,
    actor_id: userId,
    actor_email: email,
    category: "admin",
    action: "recurring_delete",
    target_type: "recurring_rules",
    target_id: id,
  });
  revalidatePath("/admin/recurring");
}

export async function generateSlots(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  const { orgId, userId, email } = await resolveOrg();

  const { data: rule } = await supabase
    .from("recurring_rules")
    .select(
      "id,organization_id,lesson_id,teacher_id,weekday,start_time,end_time,capacity,price,weeks_ahead,location"
    )
    .eq("id", id)
    .maybeSingle();
  const r = rule as {
    id: string;
    organization_id: string | null;
    lesson_id: string;
    teacher_id: string | null;
    weekday: number;
    start_time: string;
    end_time: string;
    capacity: number;
    price: number;
    weeks_ahead: number;
    location: string | null;
  } | null;
  if (!r) return;

  const today = new Date();
  const slots: Record<string, unknown>[] = [];
  // Build next N weeks of slots starting from the next occurrence of the weekday
  const weeks = Math.min(Math.max(r.weeks_ahead ?? 4, 1), 26);
  for (let w = 0; w < weeks; w++) {
    const d = new Date(today);
    const delta = (r.weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta + w * 7);
    const isoDate = d.toISOString().slice(0, 10);
    slots.push({
      organization_id: r.organization_id ?? orgId,
      lesson_id: r.lesson_id,
      teacher_id: r.teacher_id,
      date: isoDate,
      start_time: r.start_time,
      end_time: r.end_time,
      capacity: r.capacity,
      booked_count: 0,
      price: r.price,
      status: "open",
      location: r.location,
    });
  }
  if (slots.length > 0) {
    try {
      await supabase.from("booking_slots").insert(slots);
    } catch {
      // ignore — could be duplicate / schema variance
    }
  }

  await audit({
    organization_id: orgId,
    actor_id: userId,
    actor_email: email,
    category: "admin",
    action: "recurring_generate",
    target_type: "recurring_rules",
    target_id: id,
    meta: { generated: slots.length },
  });
  revalidatePath("/admin/recurring");
  revalidatePath("/admin/slots");
}
