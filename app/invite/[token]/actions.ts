"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  const { data: invite } = await supabase
    .from("invitations")
    .select("id,organization_id,role,status,expires_at")
    .eq("token", token)
    .maybeSingle();

  const row = invite as {
    id: string;
    organization_id: string;
    role: string;
    status: string;
    expires_at: string;
  } | null;
  if (!row) return;
  if (row.status !== "pending") return;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("invitations").update({ status: "expired" }).eq("id", row.id);
    return;
  }

  // Update or insert profile (organization_id + role)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user!.id)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("profiles")
      .update({ organization_id: row.organization_id, role: row.role })
      .eq("id", user!.id);
  } else {
    await supabase.from("profiles").insert({
      id: user!.id,
      email: user!.email,
      role: row.role,
      organization_id: row.organization_id,
    });
  }

  await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_by: user!.id, accepted_at: new Date().toISOString() })
    .eq("id", row.id);

  await audit({
    organization_id: row.organization_id,
    actor_id: user!.id,
    actor_email: user!.email ?? null,
    category: "admin",
    action: "invitation_accept",
    target_type: "invitations",
    target_id: row.id,
    meta: { role: row.role },
  });

  redirect("/admin");
}
