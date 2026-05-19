import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { safeFetch } from "@/lib/safe-fetch";
import { formatCurrency } from "@/lib/utils";
import {
  PlayCircle,
  Calendar,
  MessageSquare,
  CreditCard,
  Users,
  GraduationCap,
  BellRing,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: PlayCircle,
    title: "オンデマンド講座",
    desc: "動画+テキスト教材で、好きな時間に学習。進捗管理と修了証発行まで。",
  },
  {
    icon: Calendar,
    title: "予約 (対面/オンライン)",
    desc: "スクール・サロン・整体まで対応。残席は自動更新、ダブルブッキング防止。",
  },
  {
    icon: MessageSquare,
    title: "AIチャット予約",
    desc: "会話形式で希望条件を聞き出し、空き枠を即提案。離脱率を下げます。",
  },
  {
    icon: CreditCard,
    title: "決済 (Stripe / 現地)",
    desc: "Stripe Checkout / 現地支払い / デモ決済の3モード。即運用開始。",
  },
  {
    icon: BellRing,
    title: "LINE / メール通知",
    desc: "予約・受講完了で自動配信。送信状況も通知ログで追跡可能。",
  },
  {
    icon: Users,
    title: "統合CRM",
    desc: "顧客プロファイル、予約履歴、累計売上、タグ・メモを一元管理。",
  },
  {
    icon: GraduationCap,
    title: "スクール / 出席管理",
    desc: "講師・生徒・出席ステータスを記録。レッスン運営に最適化。",
  },
  {
    icon: ShieldCheck,
    title: "セキュリティ標準装備",
    desc: "Supabase Auth + RLSで権限を分離。Vercelネイティブのインフラ。",
  },
];

const stats = [
  { value: "60秒", label: "で予約完了" },
  { value: "1分", label: "で講座公開" },
  { value: "100%", label: "レスポンシブ" },
  { value: "24/7", label: "稼働可能" },
];

interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  price: number;
  sale_price: number | null;
  lesson_count: number;
}

export default async function HomePage() {
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
  const featuredCourses = await safeFetch<FeaturedCourse[]>(
    supabase
      .from("courses")
      .select(
        "id,slug,title,subtitle,category,price,sale_price,lesson_count"
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4),
    []
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthed={isAuthed} />

      {!isSupabaseConfigured() && (
        <div className="border-b bg-amber-50 text-amber-900">
          <div className="container py-2 text-xs">
            ⚠ Supabase 接続情報が未設定です (.env.local の
            <code className="mx-1 rounded bg-amber-100 px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            /
            <code className="mx-1 rounded bg-amber-100 px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            )。設定するとデータが表示されます。
          </div>
        </div>
      )}

      <section className="relative overflow-hidden border-b bg-gradient-to-b from-sky-50 via-white to-white">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Online Learning × Booking SaaS
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              学びと予約を、
              <br />
              ひとつの<span className="text-primary">ワークフロー</span>に。
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              XCloud Flow
              は、オンライン講座 (e-Learning) と対面/オンライン予約、決済、CRM、通知、スクール管理を統合したオールインワンSaaS。
              スクール・サロン・研修会社・整体院・コーチング事業者まで、これ1つで運営できます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/courses">
                  講座を見る <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/book/chat">AIチャットで予約</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-2xl font-bold tracking-tight">
                    {s.value}
                  </dt>
                  <dd className="text-xs text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-sky-200/60 blur-2xl" />
            <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-indigo-200/60 blur-2xl" />
            <Card className="relative shadow-xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="ml-2">xcloud.flow / preview</span>
                </div>
                <div className="rounded-md border bg-slate-50 p-3 text-sm">
                  <span className="font-medium">AIアシスタント</span>{" "}
                  こんにちは。本日空きはございますか？
                </div>
                <div className="ml-6 rounded-md bg-primary p-3 text-sm text-primary-foreground">
                  18:00 と 20:00 が空いています。どちらにしますか？
                </div>
                <div className="rounded-md border bg-slate-50 p-3 text-sm">
                  20:00で予約します
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <Badge variant="success">予約確定</Badge>
                  <Badge variant="secondary">LINE送信済</Badge>
                  <Badge>Stripe決済</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">注目の講座</h2>
            <p className="text-sm text-muted-foreground">
              人気のオンライン講座をピックアップ。購入後すぐに視聴できます。
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">すべての講座 →</Link>
          </Button>
        </div>
        {featuredCourses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCourses.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                className="group block"
              >
                <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <div className="aspect-video w-full bg-gradient-to-br from-sky-500 to-indigo-600 p-4 text-white">
                    <Badge variant="secondary" className="mb-2">
                      {c.category ?? "講座"}
                    </Badge>
                    <div className="line-clamp-2 text-base font-semibold">
                      {c.title}
                    </div>
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {c.subtitle ?? ""}
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        {c.sale_price ? (
                          <>
                            <span className="text-base font-bold text-rose-600">
                              {formatCurrency(c.sale_price)}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground line-through">
                              {formatCurrency(c.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-bold">
                            {formatCurrency(c.price)}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline">{c.lesson_count}本</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            まだ講座が公開されていません。
            {!isSupabaseConfigured() &&
              " (Supabase 接続後に表示されます)"}
          </div>
        )}
      </section>

      <section className="border-y bg-slate-50/60">
        <div className="container py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              ビジネスに必要なものが、全部。
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              「学ぶ」「予約する」「決済する」「顧客と繋がる」を、ひとつのアプリで。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-slate-200/70">
                <CardContent className="p-6">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 px-8 py-12 text-white shadow-xl md:px-12 md:py-16">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                今日からはじめる、新しい学びと予約。
              </h2>
              <p className="mt-3 text-sm text-white/80">
                無料登録ですぐにご利用いただけます。Stripe・LINEは任意設定で、未設定でも全機能のお試しが可能です。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">無料ではじめる</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/contact">事業者へのお問合せ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
