import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";

export async function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthed={!!user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
