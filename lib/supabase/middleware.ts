import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APEX_HOSTS = new Set<string>([
  "xcloud-flow.vercel.app",
  "www.xcloud-flow.vercel.app",
  "localhost",
  "127.0.0.1",
]);

function isAppHost(host: string | null): boolean {
  if (!host) return true;
  const bare = host.split(":")[0].toLowerCase();
  if (APEX_HOSTS.has(bare)) return true;
  // Vercel preview deployments (*.vercel.app)
  if (bare.endsWith(".vercel.app")) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Don't crash middleware if Supabase isn't reachable yet (placeholder env).
  try {
    await supabase.auth.getUser();
  } catch {
    // Ignore — Supabase not configured or unreachable.
  }

  // Custom domain support: if the host isn't one of our known app hosts,
  // try to resolve organizations.custom_domain → /x/[slug]/...
  const host = request.headers.get("host");
  const requestUrl = request.nextUrl;
  if (
    host &&
    !isAppHost(host) &&
    !requestUrl.pathname.startsWith("/_next") &&
    !requestUrl.pathname.startsWith("/api") &&
    !requestUrl.pathname.startsWith("/x/")
  ) {
    try {
      const { data } = await supabase
        .from("organizations")
        .select("slug")
        .eq("custom_domain", host.split(":")[0].toLowerCase())
        .maybeSingle();
      const slug = (data as { slug?: string } | null)?.slug;
      if (slug) {
        const rewriteUrl = requestUrl.clone();
        const restPath = requestUrl.pathname === "/" ? "" : requestUrl.pathname;
        rewriteUrl.pathname = `/x/${slug}${restPath}`;
        const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
          request: { headers: request.headers },
        });
        // Copy any cookies we set on `response`
        response.cookies.getAll().forEach((c) => rewriteResponse.cookies.set(c));
        return rewriteResponse;
      }
    } catch {
      // ignore — falling through means the host renders the default site
    }
  }

  return response;
}
