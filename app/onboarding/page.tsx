import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/server";
import { listBusinessTemplates, getBusinessTemplate } from "@/lib/business-templates";
import type { Organization } from "@/lib/types";
import { OnboardingForm } from "./form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }

  let org: Organization | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    const orgId = (profile as { organization_id?: string | null } | null)
      ?.organization_id ?? null;
    if (orgId) {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      org = (data as Organization | null) ?? null;
    }
  } catch {
    org = null;
  }

  // If we have an org and onboarding is already done, skip ahead.
  if (org?.onboarding_completed) {
    redirect("/admin");
  }

  const templates = listBusinessTemplates();
  const current = getBusinessTemplate(org?.business_type ?? "multi");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 via-white to-white">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Badge variant="secondary">ようこそ {user.email ?? ""}</Badge>
        </div>
      </header>
      <main className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>
              {org?.name ?? "スクール"}のセットアップ
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              5分程度でスクールの基本情報と最初の{current.serviceLabel}を登録します。
              後から /admin/site-config でも変更可能です。
            </p>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              templates={templates.map((t) => ({
                id: t.id,
                displayName: t.displayName,
                serviceLabel: t.serviceLabel,
                instructorLabel: t.instructorLabel,
                heroCopy: t.heroCopy,
              }))}
              initialOrg={{
                name: org?.name ?? "",
                business_type: org?.business_type ?? "multi",
                primary_color: org?.primary_color ?? "#4F46E5",
                logo_url: org?.logo_url ?? "",
                tagline: org?.tagline ?? "",
                slug: org?.slug ?? "",
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
