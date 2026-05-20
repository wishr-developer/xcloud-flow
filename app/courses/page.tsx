import { SiteShell } from "@/components/site/site-shell";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/courses/course-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "講座一覧" };

interface SearchParams {
  q?: string;
  category?: string;
  level?: string;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  let query = supabase
    .from("courses")
    .select(
      "id,slug,title,subtitle,category,level,price,sale_price,duration_minutes,lesson_count,rating_avg,rating_count"
    )
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchParams.q) {
    query = query.ilike("title", `%${searchParams.q}%`);
  }
  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }
  if (searchParams.level) {
    query = query.eq("level", searchParams.level);
  }

  const { data: courses } = await query;

  const { data: categories } = await supabase
    .from("courses")
    .select("category")
    .eq("published", true);
  const uniqueCategories = Array.from(
    new Set((categories ?? []).map((c) => c.category).filter(Boolean))
  ) as string[];

  return (
    <SiteShell skipAuth>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">講座を探す</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            自分のペースで学べるオンデマンド講座。購入後すぐに視聴開始できます。
          </p>
        </div>

        <form
          method="GET"
          className="mb-6 flex flex-wrap items-center gap-2 rounded-md border bg-white p-3"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="講座を検索..."
              className="pl-9"
            />
          </div>
          <select
            name="category"
            defaultValue={searchParams.category ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">すべてのカテゴリ</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="level"
            defaultValue={searchParams.level ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">すべてのレベル</option>
            <option value="beginner">初級</option>
            <option value="intermediate">中級</option>
            <option value="advanced">上級</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            検索
          </button>
        </form>

        {(searchParams.q || searchParams.category || searchParams.level) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">適用中:</span>
            {searchParams.q && <Badge variant="secondary">q: {searchParams.q}</Badge>}
            {searchParams.category && (
              <Badge variant="secondary">{searchParams.category}</Badge>
            )}
            {searchParams.level && (
              <Badge variant="secondary">{searchParams.level}</Badge>
            )}
            <Link href="/courses" className="text-xs text-primary hover:underline">
              クリア
            </Link>
          </div>
        )}

        {courses && courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            該当する講座が見つかりません。
          </div>
        )}
      </div>
    </SiteShell>
  );
}
