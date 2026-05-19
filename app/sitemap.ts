import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

const STATIC_PATHS = [
  "",
  "/pricing",
  "/courses",
  "/book",
  "/book/chat",
  "/faq",
  "/contact",
  "/announcements",
  "/login",
  "/signup",
];

const INDUSTRY_SLUGS = [
  "sports",
  "yoga",
  "music",
  "cooking",
  "dance",
  "fitness",
  "art",
  "language",
  "learning",
  "business",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    ...STATIC_PATHS.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...INDUSTRY_SLUGS.map((s) => ({
      url: `${SITE_URL}/industries/${s}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  // Append public organizations
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("organizations")
      .select("slug,updated_at")
      .eq("status", "active")
      .limit(1000);
    const orgs = (data as { slug: string; updated_at: string }[] | null) ?? [];
    for (const o of orgs) {
      entries.push({
        url: `${SITE_URL}/x/${o.slug}`,
        lastModified: o.updated_at ? new Date(o.updated_at) : now,
        changeFrequency: "daily",
        priority: 0.5,
      });
    }
  } catch {
    // Supabase unavailable — return static portion.
  }
  return entries;
}
