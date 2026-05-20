"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { sendEmail, escapeHtml } from "@/lib/email";

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

  // Resolve organization name for the email body.
  let orgName = "スクール";
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle();
    orgName = (org as { name?: string } | null)?.name ?? orgName;
  } catch {
    // ignore
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";
  const inviteUrl = `${siteUrl}/invite/${token}`;

  await sendEmail({
    to: email,
    subject: `【XCloud-Flow】${orgName} への招待`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <h2>${escapeHtml(orgName)} への招待</h2>
        <p>${escapeHtml(user.email ?? "")} さんが、あなたを ${escapeHtml(orgName)} の <strong>${escapeHtml(role)}</strong> として招待しました。</p>
        <p>以下のリンクから 14 日以内にご参加ください。</p>
        <p><a href="${inviteUrl}" style="display:inline-block; background:#4F46E5; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none;">招待を受ける</a></p>
        <p style="font-size:12px; color:#64748b;">リンクが開けない場合は次の URL をブラウザに貼り付けてください: ${inviteUrl}</p>
        <p style="font-size:12px; color:#64748b; margin-top:24px;">XCloud-Flow から自動送信されています。心当たりがない場合はこのメールを破棄してください。</p>
      </div>
    `,
    category: "invitation",
    organizationId: orgId,
  });

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
