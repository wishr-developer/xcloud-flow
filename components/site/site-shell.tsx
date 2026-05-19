import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";

export async function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  let isAuthed = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthed = !!user;
  } catch {
    isAuthed = false;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthed={isAuthed} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
