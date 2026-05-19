# XCloud Flow

オンライン学習 × 予約 × 決済 × CRM を統合した次世代ラーニング/業務プラットフォーム。
Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth/DB/RLS) で構築されています。

## 主な機能

### 顧客向け
- **オンライン講座 (e-Learning)** — カテゴリ・レベル・キーワード検索、講座詳細、無期限視聴
- **動画レッスン受講UI** — カリキュラム表示、進捗自動計算、修了時の証明書発行
- **予約 (通常 / AIチャット)** — 残席リアルタイム反映、ダブルブッキング防止
- **マイページ** — 受講中講座、予約履歴、修了証
- **お知らせ / FAQ / お問い合わせ**
- **ログイン / サインアップ (Supabase Auth)**
- レスポンシブ対応 (モバイル/タブレット/PC)、ハンバーガーメニュー

### 管理者向け
- **ダッシュボード** — 今日/今月の予約数、累計受講者、月次売上 (予約+講座)、未対応問合せ
- **講座管理** — 講座 CRUD、セクション/レッスン編集、注目フラグ
- **受講者管理** — 各講座の進捗・支払い状況
- **予約 / 予約枠 / レッスン / 講師 CRUD**
- **CRM (顧客)** — 累計予約・売上・タグ・メモ・履歴
- **スクール管理** — 本日の出席、欠席記録
- **決済・通知ログ**
- **マーケティング** — お知らせ、FAQ、クーポン、お問い合わせ受信箱
- **設定** — LINE Webhook、Stripe price ID、管理者昇格

### 決済 / 通知
- **Stripe Checkout** (任意。`STRIPE_SECRET_KEY` 未設定時は自動でデモ決済)
- **LINE Webhook 通知** (任意。未設定時は `skipped` としてログ)
- **クーポン** (パーセント / 固定額、利用上限・有効期限対応)

## クイックスタート (ローカル)

```bash
# 依存をインストール
npm install

# .env.local を作成し Supabase 接続情報を記入
cp .env.local.example .env.local

# Supabase に下記2ファイルを順番に適用
#   1. supabase/migrations/0001_init.sql
#   2. supabase/migrations/0002_xcloud_flow.sql

# 開発サーバー起動
npm run dev
# → http://localhost:3000
```

サインアップ後に Supabase の SQL から自身を管理者に昇格:

```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

または `/admin/settings` の「管理者権限を付与」フォームから昇格できます。

## GitHub と Vercel への接続

### 1. GitHub リポジトリを作成して push

```bash
git init
git add -A
git commit -m "feat: initial XCloud Flow MVP"
git branch -M main

# GitHub で空のリポジトリを作成して、その URL を origin に設定:
git remote add origin git@github.com:<あなたのアカウント>/xcloud-flow.git
git push -u origin main
```

> GitHub CLI が入っていれば `gh repo create xcloud-flow --public --source=. --push` の1コマンドで作成できます。

### 2. Vercel にプロジェクトを接続

1. https://vercel.com/new で 「Import Git Repository」 を選び、上記リポジトリを選択
2. Framework は **Next.js** (自動検出されます)
3. **Environment Variables** を入力:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY` (任意)
   - `LINE_WEBHOOK_URL` (任意)
4. **Deploy** をクリック

以降は `git push` ごとにプレビュー URL が発行され、`main` への push が本番にデプロイされます。

### Vercel CLI で確認したい場合

```bash
npm i -g vercel
vercel link        # 既存プロジェクトを紐付け
vercel             # プレビューデプロイ
vercel --prod      # 本番デプロイ
```

## ディレクトリ構成

```
app/
  page.tsx                       # ランディング
  courses/...                    # 講座カタログ + 受講UI
  book/...                       # 予約 (通常 + AIチャット)
  my/...                         # マイページ
  announcements/, faq/, contact/ # マーケティング
  api/
    bookings/, enrollments/, lesson-progress/, contact/
  admin/
    courses/, enrollments/, bookings/, slots/, lessons/, teachers/
    students/, customers/, payments/, notifications/
    announcements/, faqs/, coupons/, contacts/, settings/
components/
  site/                          # 公開サイトの header / footer / logo
  admin/                         # 管理画面 sidebar / topbar / kpi
  courses/                       # course-card
  ui/                            # shadcn/ui コンポーネント
lib/
  supabase/                      # client / server / middleware
  booking.ts, enrollment.ts      # 予約 / 受講のドメインロジック
  types.ts, utils.ts
supabase/migrations/
  0001_init.sql                  # 予約・CRM・通知・決済テーブル
  0002_xcloud_flow.sql           # 講座・受講・マーケティング
```

## 本番化のステップ

- [ ] Stripe Webhook (`/api/stripe/webhook`) を実装し `checkout.session.completed` で `payment_status=paid` 更新
- [ ] Supabase Email confirm を ON にして本番テンプレを整える
- [ ] OpenAI API を `/api/chat` に追加し、AIチャットを本物のLLMに置換
- [ ] LINE Messaging API の正規認証 + 個別 ユーザー ID 配信
- [ ] 動画ホスティング (Mux / Cloudflare Stream) との連携
- [ ] 修了証 PDF 生成 (PDF-Lib / Puppeteer)
- [ ] 法人 (B2B) 向け: 一括受講登録、団体請求
- [ ] 監視: Sentry / Logflare、レート制限 / BotID
- [ ] テスト: Vitest + Playwright

## ライセンス

MIT (社内利用前提のため、配布する場合は適宜変更してください)
