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
  Calendar,
  MessageSquare,
  CreditCard,
  Bell,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
  Trophy,
  Utensils,
  Music2,
  Flame,
  Flower2,
  Dumbbell,
  Palette,
  PlayCircle,
  Brain,
  CheckCircle2,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const INDUSTRIES = [
  { icon: BookOpen, label: "学習塾", desc: "個別/集団授業の予約・出席" },
  { icon: Trophy, label: "スポーツ", desc: "クラブ・体験会の運営" },
  { icon: Utensils, label: "料理教室", desc: "材料費含む決済まで一括" },
  { icon: Music2, label: "音楽教室", desc: "ピアノ・ボーカル等の枠予約" },
  { icon: Flame, label: "ダンス", desc: "スタジオ・体験レッスン" },
  { icon: Flower2, label: "ヨガ", desc: "クラスチケット制にも対応" },
  { icon: Dumbbell, label: "フィットネス", desc: "パーソナル・グループ" },
  { icon: Palette, label: "アート", desc: "ワークショップ管理" },
];

const FEATURES = [
  {
    icon: Calendar,
    title: "予約・スケジュール",
    desc: "対面/オンライン/ハイブリッド、定員・待機リスト・キャンセル管理まで。",
  },
  {
    icon: PlayCircle,
    title: "オンデマンド受講",
    desc: "動画+テキスト教材、進捗自動計算、修了証の自動発行に対応。",
  },
  {
    icon: MessageSquare,
    title: "AIチャット予約",
    desc: "業種に応じた会話文で、初めての方でも迷わず予約完了。",
  },
  {
    icon: CreditCard,
    title: "決済 (Stripe / 現地)",
    desc: "クレジット・現地支払い・デモ決済の3モード。クーポンも標準装備。",
  },
  {
    icon: Bell,
    title: "LINE / メール通知",
    desc: "予約・受講完了で自動送信。送信ログで追跡可能。",
  },
  {
    icon: Users,
    title: "顧客 (CRM)",
    desc: "受講者プロファイル、予約履歴、累計売上、タグ・メモを一元管理。",
  },
  {
    icon: Brain,
    title: "AIアシスト運営",
    desc: "受講者対応、空き提案、FAQ自動応答に拡張可能 (OpenAI連携)。",
  },
  {
    icon: ShieldCheck,
    title: "セキュリティ標準",
    desc: "Supabase Auth + RLSで権限を分離。Vercelネイティブのインフラ。",
  },
];

const STATS = [
  { value: "10+", label: "業種テンプレート" },
  { value: "60秒", label: "で予約完了" },
  { value: "100%", label: "レスポンシブ" },
  { value: "24/7", label: "稼働可能" },
];

interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  industry: string | null;
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
        "id,slug,title,subtitle,category,industry,price,sale_price,lesson_count"
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
            ⚠ Supabase 接続情報が未設定です。
            <code className="mx-1 rounded bg-amber-100 px-1">.env.local</code>
            と Vercel の Environment Variables を設定するとデータが表示されます。
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-sky-50 via-white to-white">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              All-in-one School Operations SaaS
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              予約、受講管理、決済、通知、
              <br />
              <span className="text-primary">AI対応</span>をひとつに。
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              学習塾、スポーツ、料理、音楽、語学、ダンス、ヨガ、フィットネス、アート、ビジネス研修まで。
              あらゆるスクール業態のためのオールインワンSaaS、<span className="font-semibold text-foreground">XCloud-Flow</span>。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  無料ではじめる <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/book/chat">AIチャットで予約デモ</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-4 gap-4">
              {STATS.map((s) => (
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
                  <span className="ml-2">xcloud-flow / live preview</span>
                </div>
                <div className="rounded-md border bg-slate-50 p-3 text-sm">
                  <span className="font-medium">AIアシスタント</span>{" "}
                  ご希望の教室と日時を教えてください。
                </div>
                <div className="ml-6 rounded-md bg-primary p-3 text-sm text-primary-foreground">
                  朝ヨガクラス、土曜日の朝が良いです。
                </div>
                <div className="rounded-md border bg-slate-50 p-3 text-sm">
                  土曜 7:00 と 8:30 が空いています。どちらにしますか？
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

      {/* INDUSTRIES */}
      <section className="container py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            あらゆるスクール業態に。
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            業種に応じた予約導線・出席管理・決済・通知をひとつのSaaSで。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <Card
              key={i.label}
              className="group transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-primary">
                  <i.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{i.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{i.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Badge variant="secondary" className="text-xs">
            <Building2 className="mr-1 h-3 w-3" />
            法人 / フランチャイズ / 複数拠点運営にも拡張可能
          </Badge>
        </div>
      </section>

      {/* COURSES */}
      <section className="border-y bg-slate-50/60">
        <div className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                注目の講座・コース
              </h2>
              <p className="text-sm text-muted-foreground">
                人気のオンデマンド講座をピックアップ。購入後すぐに視聴できます。
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
                        {c.industry ?? c.category ?? "講座"}
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
            <div className="rounded-md border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">
              まだ講座が公開されていません。
              {!isSupabaseConfigured() && " (Supabase 接続後に表示されます)"}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            運営に必要なものが、全部。
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            「予約する」「受講する」「決済する」「顧客と繋がる」を、ひとつのアプリで。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
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
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y bg-slate-50/60">
        <div className="container py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              導入は3ステップ
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "アカウント作成",
                desc: "メール 1つで開始。クレジットカード不要。",
              },
              {
                step: "02",
                title: "業種テンプレートを選ぶ",
                desc: "学習塾・スポーツ・ヨガなどから選び、即運用開始。",
              },
              {
                step: "03",
                title: "予約・決済が動く",
                desc: "AIチャット予約・Stripe決済・LINE通知まで標準搭載。",
              },
            ].map((s) => (
              <Card key={s.step}>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary/40">
                    {s.step}
                  </div>
                  <h3 className="mt-2 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 px-8 py-12 text-white shadow-xl md:px-12 md:py-16">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                今日からはじめる、スクール運営のDX。
              </h2>
              <p className="mt-3 text-sm text-white/80">
                無料登録ですぐにご利用いただけます。Stripe・LINE・OpenAIは任意設定で、未設定でも全機能のお試しが可能です。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  クレジットカード不要
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  業種テンプレートを切り替えるだけ
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  スマホ/タブレット/PCすべてに対応
                </li>
              </ul>
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
