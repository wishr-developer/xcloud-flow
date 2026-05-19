import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyCertificatesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Find enrollments for the user, then fetch their certificates
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course:course_id(slug,title)")
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email ?? ""}`);

  const ids = (enrollments ?? []).map((e) => e.id);
  const { data: certs } = ids.length
    ? await supabase
        .from("certificates")
        .select("*, enrollment:enrollment_id(course:course_id(slug,title))")
        .in("enrollment_id", ids)
        .order("issued_at", { ascending: false })
    : { data: [] as Array<{
        id: string;
        certificate_number: string;
        issued_at: string;
        enrollment: { course: { slug?: string; title?: string } | null } | null;
      }> };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">修了証</CardTitle>
      </CardHeader>
      <CardContent>
        {certs && certs.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {certs.map((c) => {
              const e = c.enrollment as
                | { course?: { slug?: string; title?: string } }
                | null;
              return (
                <li
                  key={c.id}
                  className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5"
                >
                  <Award className="absolute right-3 top-3 h-12 w-12 text-amber-500/30" />
                  <Badge variant="warning">CERTIFICATE</Badge>
                  <h3 className="mt-3 text-lg font-bold">
                    {e?.course?.title ?? "-"}
                  </h3>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    No. {c.certificate_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    発行日: {formatDate(c.issued_at)}
                  </div>
                  {e?.course?.slug && (
                    <Link
                      href={`/courses/${e.course.slug}`}
                      className="mt-3 inline-block text-xs text-primary hover:underline"
                    >
                      講座を見る →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            修了証はまだありません。
            <br />
            講座を完了すると自動で発行されます。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
