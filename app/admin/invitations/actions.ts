"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

async function resolveOrgId(): Promise<{
  user: { id: string; email: string | null } | null;
  orgId: string | null;
}> {
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
  return { user: { id: user.id, email: user.email ?? null }, orgId };
}

export async function createInvitation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "staff");
  if (!email) return;

  const supabase = createClient();
  const { user, orgId } = await resolveOrgId();
  if (!user || !orgId) return;

  const token = newToken();
  await supabase.from("invitations").insert({
    organization_id: orgId,
    email,
    role,
    token,
    status: "pending",
    invited_by: user.id,
  });

  await audit({
    organization_id: orgId,
    actor_id: user.id,
    actor_email: user.email,
    category: "admin",
    action: "invitation_create",
    target_type: "invitations",
    meta: { email, role },
  });

  // Best-effort email send (only logs to notification_logs since we don't ship a mailer).
  try {
    await supabase.from("notification_logs").insert({
      organization_id: orgId,
      type: "email",
      status: "skipped",
      message: `招待メール (未設定) → ${email}: ${role}`,
    });
  } catch {
    // ignore
  }

  revalidatePath("/admin/invitations");
}

export async function revokeInvitation(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  const { user, orgId } = await resolveOrgId();
  if (!user || !orgId) return;
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("organization_id", orgId);
  await audit({
    organization_id: orgId,
    actor_id: user.id,
    actor_email: user.email,
    category: "admin",
    action: "invitation_revoke",
    target_type: "invitations",
    target_id: id,
  });
  revalidatePath("/admin/invitations");
}
