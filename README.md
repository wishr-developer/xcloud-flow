# XCloud-Flow

予約、受講管理、決済、通知、AI対応をひとつに。
学習塾・スポーツ・料理・音楽・語学・ダンス・ヨガ・フィットネス・アート・ビジネス研修まで、
**あらゆるスクール業態**に対応するオールインワン SaaS。

Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth/DB/RLS) で構築。

## 主な機能

### 顧客向け
- 予約 (対面 / オンライン / ハイブリッド) + 残席リアルタイム反映
- AIチャット予約 (業種に応じた会話文に自動切り替え)
- オンデマンド受講 (動画+テキスト、進捗管理、修了証)
- マイページ (受講・予約・修了証)
- お知らせ / FAQ / お問い合わせ
- ログイン / サインアップ (Supabase Auth)

### 管理者向け
- ダッシュボード (今日/今月予約、累計受講者、月次売上、未対応問合せ)
- 講座 / レッスン / 予約枠 / 講師 CRUD
- 受講者 / 予約 / 顧客 CRM
- スクール出席管理
- お知らせ / FAQ / クーポン / 問い合わせ管理
- **サイト設定 (業種テンプレート / 呼称 / プライマリーカラー)**
- 決済・通知ログ・管理者昇格

### 業種テンプレート
`multi / learning / sports / cooking / music / language / dance / yoga / fitness / art / business / other`
管理画面の「サイト設定」で切替可能。AIチャットの文言や呼称が自動で変わります。

### 決済 / 通知
- **Stripe Checkout** (未設定なら自動でデモ決済)
- **LINE Webhook 通知** (未設定なら "skipped" ログ)
- **クーポン** (パーセント / 固定額、利用上限・有効期限対応)

---

## クイックスタート (ローカル)

```bash
# 1. 依存をインストール
npm install

# 2. .env.local を作成 (Supabase URL は記入済み)
cp .env.local.example .env.local
# → NEXT_PUBLIC_SUPABASE_ANON_KEY だけ Supabase Dashboard から貼り付け

# 3. Supabase SQL Editor に以下を順番に流す
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_xcloud_flow.sql
#   supabase/migrations/0003_multi_industry.sql
# (一括で良ければ supabase/_combined.sql)

# 4. 起動
npm run dev
# → http://localhost:3000
```

### 管理者昇格

サインアップ後に Supabase SQL Editor で:
```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

---

## Vercel デプロイ

GitHub: https://github.com/wishr-developer/xcloud-flow

### 1. Vercel に Import

1. https://vercel.com/new → Import Git Repository → `wishr-developer/xcloud-flow`
2. **Project Name**: `XCloud-Flow`
3. Framework: Next.js (自動検出)

### 2. Environment Variables を設定

| Key | Value | 必須 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jzktegqjepzvusijhrhzd.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase の anon key) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://xcloud-flow.vercel.app` (デプロイ後の URL) | ✅ |
| `STRIPE_SECRET_KEY` | (任意) | — |
| `STRIPE_WEBHOOK_SECRET` | (任意) | — |
| `LINE_WEBHOOK_URL` | (任意) | — |
| `OPENAI_API_KEY` | (任意) | — |
| `SUPABASE_SERVICE_ROLE_KEY` | (任意・将来Stripe webhook用) | — |

### 3. Deploy

`git push` ごとに自動でプレビュー URL、`main` push で本番デプロイされます。

### Vercel CLI 経由

```bash
npm i -g vercel
vercel link
vercel             # プレビュー
vercel --prod      # 本番
```

---

## ディレクトリ構成

```
app/
  page.tsx                      # マルチ業種ランディング (8業種カード)
  courses/...                   # 講座カタログ + 受講UI
  book/...                      # 予約 (通常 + AIチャット, 業種別文言)
  my/...                        # マイページ
  announcements/, faq/, contact/
  api/bookings/, enrollments/, lesson-progress/, contact/
  admin/
    site-config/                # 業種テンプレート切替
    courses/, enrollments/, bookings/, slots/, lessons/, teachers/
    students/, customers/, payments/, notifications/
    announcements/, faqs/, coupons/, contacts/, settings/
components/
  site/                         # 公開サイトの header / footer / logo
  admin/                        # 管理画面 sidebar / topbar / kpi
  courses/                      # course-card
  ui/                           # shadcn/ui コンポーネント
lib/
  supabase/                     # client / server / middleware (placeholder fallback)
  booking.ts, enrollment.ts     # 予約 / 受講のドメインロジック
  site-config.ts                # 業種テンプレート + チャットgreeting
  safe-fetch.ts                 # データ取得失敗のフォールバック
  types.ts, utils.ts
supabase/migrations/
  0001_init.sql                 # 予約・CRM・通知・決済
  0002_xcloud_flow.sql          # e-Learning + マーケティング
  0003_multi_industry.sql       # site_config + 業種汎用フィールド
supabase/_combined.sql          # 上記3つを結合 (1ファイルで一括実行可)
supabase/verify.sql             # 反映確認用
```

---

## 本番化のステップ

- [ ] Stripe Webhook 実装 (`/api/stripe/webhook` で payment_status を paid に)
- [ ] LINE Messaging API 正規認証
- [ ] OpenAI で `/api/chat` を本物の LLM に置換
- [ ] 動画ホスティング連携 (Mux / Cloudflare Stream)
- [ ] 修了証 PDF 出力
- [ ] 法人 (B2B) 一括受講登録
- [ ] 監視 (Sentry / Logflare)
- [ ] テスト (Vitest + Playwright)

---

## ライセンス

MIT
