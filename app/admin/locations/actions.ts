"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

async function resolveOrg() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, orgId: null };
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
  return { user, orgId };
}

export async function createLocation(formData: FormData) {
  const supabase = createClient();
  const { user, orgId } = await resolveOrg();
  if (!user || !orgId) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("locations").insert({
    organization_id: orgId,
    name,
    address: String(formData.get("address") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    timezone: String(formData.get("timezone") ?? "Asia/Tokyo"),
    online: formData.get("online") === "1",
    active: true,
  });
  // Mark the organization as multi-location once they have >=2 locations.
  try {
    const { count } = await supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);
    if ((count ?? 0) >= 2) {
      await supabase
        .from("organizations")
        .update({ multi_location: true })
        .eq("id", orgId);
    }
  } catch {
    // ignore
  }
  await audit({
    organization_id: orgId,
    actor_id: user.id,
    actor_email: user.email ?? null,
    category: "admin",
    action: "location_create",
    target_type: "locations",
    meta: { name },
  });
  revalidatePath("/admin/locations");
}

export async function toggleLocation(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";
  if (!id) return;
  const { user, orgId } = await resolveOrg();
  if (!user || !orgId) return;
  await supabase.from("locations").update({ active }).eq("id", id).eq("organization_id", orgId);
  await audit({
    organization_id: orgId,
    actor_id: user.id,
    actor_email: user.email ?? null,
    category: "admin",
    action: active ? "location_activate" : "location_deactivate",
    target_type: "locations",
    target_id: id,
  });
  revalidatePath("/admin/locations");
}

export async function deleteLocation(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { user, orgId } = await resolveOrg();
  if (!user || !orgId) return;
  await supabase.from("locations").delete().eq("id", id).eq("organization_id", orgId);
  await audit({
    organization_id: orgId,
    actor_id: user.id,
    actor_email: user.email ?? null,
    category: "admin",
    action: "location_delete",
    target_type: "locations",
    target_id: id,
  });
  revalidatePath("/admin/locations");
}
