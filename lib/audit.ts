import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export interface AuditEntry {
  organization_id?: string | null;
  actor_id?: string | null;
  actor_email?: string | null;
  category: "organization" | "admin" | "booking" | "course" | "subscription" | "system";
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  meta?: Record<string, unknown> | null;
}

export async function audit(entry: AuditEntry, client?: SupabaseClient) {
  try {
    const supabase = client ?? createClient();
    await supabase.from("audit_logs").insert({
      organization_id: entry.organization_id ?? null,
      actor_id: entry.actor_id ?? null,
      actor_email: entry.actor_email ?? null,
      category: entry.category,
      action: entry.action,
      target_type: entry.target_type ?? null,
      target_id: entry.target_id ?? null,
      meta: entry.meta ?? null,
    });
  } catch {
    // Audit is best-effort; never block business logic.
  }
}
