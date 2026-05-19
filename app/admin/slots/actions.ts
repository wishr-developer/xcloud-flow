"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSlot(formData: FormData): Promise<void> {
  const supabase = createClient();
  const lesson_id = String(formData.get("lesson_id") ?? "");
  const teacher_id = String(formData.get("teacher_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const capacity = Number(formData.get("capacity") ?? 1);
  const price = Number(formData.get("price") ?? 0);

  if (!lesson_id || !date || !start_time || !end_time) return;

  await supabase.from("booking_slots").insert({
    lesson_id,
    teacher_id: teacher_id || null,
    date,
    start_time,
    end_time,
    capacity,
    price,
    booked_count: 0,
    status: "open",
  });
  revalidatePath("/admin/slots");
}

export async function deleteSlot(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("booking_slots").delete().eq("id", id);
  revalidatePath("/admin/slots");
}

export async function toggleSlotStatus(
  id: string,
  current: string
): Promise<void> {
  const supabase = createClient();
  const next = current === "open" ? "closed" : "open";
  await supabase.from("booking_slots").update({ status: next }).eq("id", id);
  revalidatePath("/admin/slots");
}
