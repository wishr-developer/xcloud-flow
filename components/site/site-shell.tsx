import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";

interface SiteShellProps {
  children: React.ReactNode;
  /**
   * Skip the Supabase auth lookup. Required for pages that want to be
   * statically generated / ISR cached. Authed users still see "ログイン /
   * 無料登録" in the desktop header, but the BottomNav still routes them to
   * /my and /admin, so the trade-off is purely cosmetic.
   */
  skipAuth?: boolean;
}

export async function SiteShell({ children, skipAuth = false }: SiteShellProps) {
  let isAuthed = false;
  if (!skipAuth) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isAuthed = !!user;
    } catch {
      isAuthed = false;
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthed={isAuthed} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
