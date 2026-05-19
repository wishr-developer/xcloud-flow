import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getBusinessTemplate } from "@/lib/business-templates";
import { formatCurrency } from "@/lib/utils";
import type { Organization } from "@/lib/types";
import { Calendar, MessageSquare, MapPin, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function loadOrg(slug: string): Promise<Organization | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as Organization | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const org = await loadOrg(params.slug);
  if (!org) return { title: "Not Found" };
  const template = getBusinessTemplate(org.business_type);
  const title = `${org.name} — ${template.displayName}`;
  const description = org.tagline ?? org.hero_copy ?? template.heroCopy;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function OrgPublicPage({ params }: PageProps) {
  const org = await loadOrg(params.slug);
  if (!org) {
    notFound();
  }
  const template = getBusinessTemplate(org.business_type);

  // Fetch a small set of lessons + upcoming slots for this org
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [lessonsRes, slotsRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id,title,description,duration_minutes,price")
      .eq("organization_id", org.id)
      .eq("active", true)
      .limit(6),
    supabase
      .from("booking_slots")
      .select("id,date,start_time,end_time,price,capacity,booked_count,lesson:lesson_id(title)")
      .eq("organization_id", org.id)
      .gte("date", today)
      .eq("status", "open")
      .order("date", { ascending: true })
      .limit(6),
  ]);

  const lessons = (lessonsRes.data as { id: string; title: string; description: string | null; duration_minutes: number; price: number }[] | null) ?? [];
  const slots = (slotsRes.data as { id: string; date: string; start_time: string; end_time: string; price: number; capacity: number; booked_count: number; lesson: { title?: string } | { title?: string }[] | null }[] | null) ?? [];

  const brand = org.primary_color ?? "#4F46E5";

  // Structured data (LocalBusiness)
  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: org.name,
    description: org.tagline ?? org.hero_copy ?? template.heroCopy,
    url: org.website ?? undefined,
    telephone: org.phone ?? undefined,
    email: org.contact_email ?? undefined,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      {/* HERO */}
      <section
        className="border-b"
        style={{
          background: `linear-gradient(135deg, ${brand}14 0%, #ffffff 60%)`,
        }}
      >
        <div className="container py-16 md:py-20">
          <Badge variant="secondary" className="mb-3">
            {template.displayName}
          </Badge>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {org.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={org.logo_url}
                  alt={`${org.name} logo`}
                  className="mb-4 h-12 w-auto"
                />
              ) : null}
              <h1
                className="text-3xl font-bold tracking-tight sm:text-5xl"
                style={{ color: brand }}
              >
                {org.name}
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                {org.tagline ?? org.hero_copy ?? template.heroCopy}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" style={{ background: brand }}>
                  <Link href={`/x/${org.slug}/book`}>
                    <Calendar className="mr-1 h-4 w-4" />
                    予約する
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={`/x/${org.slug}/chat`}>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    AIチャット予約
                  </Link>
                </Button>
              </div>
            </div>
            <Card className="w-full md:max-w-sm">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="font-semibold">ご案内</div>
                {org.contact_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {org.contact_email}
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" /> {org.phone}
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {org.website}
                  </div>
                )}
                <div className="pt-1 text-xs text-muted-foreground">
                  Powered by XCloud-Flow
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* LESSONS */}
      <section className="container py-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          {template.serviceLabel}一覧
        </h2>
        {lessons.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">
            まだ{template.serviceLabel}が登録されていません。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map((l) => (
              <Card key={l.id}>
                <CardContent className="space-y-2 p-5">
                  <div className="text-base font-semibold">{l.title}</div>
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {l.description ?? ""}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold">
                      {formatCurrency(l.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {l.duration_minutes}分
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SLOTS */}
      <section className="border-t bg-slate-50/60">
        <div className="container py-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            空き{template.scheduleLabel}
          </h2>
          {slots.length === 0 ? (
            <div className="rounded-md border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">
              現在ご案内できる空き{template.scheduleLabel}はありません。
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((s) => {
                const lessonTitle = Array.isArray(s.lesson)
                  ? s.lesson[0]?.title
                  : s.lesson?.title;
                return (
                  <Link
                    key={s.id}
                    href={`/book/${s.id}`}
                    className="group block"
                  >
                    <Card className="transition group-hover:-translate-y-0.5 group-hover:shadow">
                      <CardContent className="p-4 text-sm">
                        <div className="font-semibold">
                          {lessonTitle ?? template.serviceLabel}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {s.date} {s.start_time?.slice(0, 5)}-
                          {s.end_time?.slice(0, 5)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-bold" style={{ color: brand }}>
                            {formatCurrency(s.price ?? 0)}
                          </span>
                          <Badge variant="secondary">
                            残{(s.capacity ?? 1) - (s.booked_count ?? 0)}席
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
