"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type PatchInput = {
  status?: "confirmed" | "canceled";
  attendance_status?: "enrolled" | "attended" | "absent" | "canceled";
  payment_status?: "unpaid" | "pending" | "paid" | "demo_paid";
};

export async function updateBookingStatus(
  id: string,
  patch: PatchInput
): Promise<void> {
  const supabase = createClient();

  if (patch.status === "canceled") {
    const { data: booking } = await supabase
      .from("bookings")
      .select("status, slot_id")
      .eq("id", id)
      .single();
    if (booking && booking.status !== "canceled" && booking.slot_id) {
      const { data: slot } = await supabase
        .from("booking_slots")
        .select("booked_count, capacity")
        .eq("id", booking.slot_id)
        .single();
      if (slot) {
        const nextCount = Math.max(0, (slot.booked_count ?? 0) - 1);
        await supabase
          .from("booking_slots")
          .update({
            booked_count: nextCount,
            status: nextCount >= slot.capacity ? "full" : "open",
          })
          .eq("id", booking.slot_id);
      }
    }
  }

  await supabase.from("bookings").update(patch).eq("id", id);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function setAttendance(
  id: string,
  status: "enrolled" | "attended" | "absent" | "canceled"
): Promise<void> {
  await updateBookingStatus(id, { attendance_status: status });
}

export async function setPaymentStatus(
  id: string,
  status: "unpaid" | "pending" | "paid" | "demo_paid"
): Promise<void> {
  await updateBookingStatus(id, { payment_status: status });
}

export async function cancelBooking(id: string): Promise<void> {
  await updateBookingStatus(id, {
    status: "canceled",
    attendance_status: "canceled",
  });
}
