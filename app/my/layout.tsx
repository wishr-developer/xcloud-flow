import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/site/site-shell";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/my", label: "ホーム" },
  { href: "/my/courses", label: "受講中の講座" },
  { href: "/my/bookings", label: "予約履歴" },
  { href: "/my/certificates", label: "修了証" },
];

export default async function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/my");
  }

  return (
    <SiteShell>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">マイページ</h1>
          <p className="text-sm text-muted-foreground">
            ご自身の受講・予約・修了情報を確認できます。
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <aside>
            <nav className="rounded-md border bg-white p-2">
              <ul className="space-y-1 text-sm">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className={cn(
                        "block rounded-md px-3 py-2 transition-colors hover:bg-slate-100"
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </SiteShell>
  );
}
