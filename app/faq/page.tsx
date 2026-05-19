import { SiteShell } from "@/components/site/site-shell";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const supabase = createClient();
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("published", true)
    .order("category", { ascending: true })
    .order("order_index", { ascending: true });

  const grouped: Record<string, typeof faqs> = {};
  (faqs ?? []).forEach((f) => {
    const cat = f.category ?? "その他";
    (grouped[cat] = grouped[cat] ?? []).push(f);
  });

  return (
    <SiteShell>
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">よくある質問</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          サービスのご利用にあたってよくお問い合わせいただく内容をまとめました。
        </p>

        <div className="mt-8 space-y-8">
          {Object.entries(grouped).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                FAQ はまだありません。
              </CardContent>
            </Card>
          ) : (
            Object.entries(grouped).map(([cat, list]) => (
              <section key={cat}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </h2>
                <div className="space-y-2">
                  {list!.map((f) => (
                    <details
                      key={f.id}
                      className="group rounded-md border bg-white p-4"
                    >
                      <summary className="cursor-pointer list-none text-base font-medium">
                        <span className="mr-2 text-primary">Q.</span>
                        {f.question}
                      </summary>
                      <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                        <span className="mr-2 font-semibold text-foreground">
                          A.
                        </span>
                        {f.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </SiteShell>
  );
}
