import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "staff", "teacher"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // Resolve profile + org for guard / banners.
  let role: string | null = null;
  let orgId: string | null = null;
  let onboarded: boolean | null = null;
  let plan: string = "free";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .maybeSingle();
    role = (profile as { role?: string | null } | null)?.role ?? null;
    orgId = (profile as { organization_id?: string | null } | null)
      ?.organization_id ?? null;
  } catch {
    role = null;
  }

  if (role && !ADMIN_ROLES.has(role)) {
    // Customers / students don't belong in /admin
    redirect("/my");
  }

  if (orgId) {
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("plan, onboarding_completed")
        .eq("id", orgId)
        .maybeSingle();
      plan = (org as { plan?: string } | null)?.plan ?? "free";
      onboarded =
        (org as { onboarding_completed?: boolean } | null)?.onboarding_completed ??
        null;
    } catch {
      // ignore
    }
  }

  let unreadCount = 0;
  try {
    const { count } = await supabase
      .from("in_app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={user.email} unreadCount={unreadCount} />
        <main className="flex-1 overflow-x-auto p-6">
          {onboarded === false && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <Badge variant="warning">セットアップ未完了</Badge>
              <span>業種・スクール情報を5分でセットアップしませんか？</span>
              <Link
                href="/onboarding"
                className="ml-auto rounded-md bg-amber-900 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800"
              >
                セットアップを続ける
              </Link>
            </div>
          )}
          {plan === "free" && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border bg-sky-50/60 px-3 py-2 text-xs text-slate-700">
              <Badge variant="secondary">Free</Badge>
              <span>月10件まで予約可能。上限を超える場合は Starter / Pro へアップグレードしてください。</span>
              <Link
                href="/pricing"
                className="ml-auto text-xs text-primary underline"
              >
                プランを見る →
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
