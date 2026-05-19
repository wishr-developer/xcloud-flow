# XCloud-Flow Release Checklist

このドキュメントは XCloud-Flow を本番β リリースする際の手順書です。
各セクションを上から順に確認してください。

---

## 1. Supabase

- [ ] Supabase Project を作成 (`https://jzktegqjepzvusijhrhzd.supabase.co` が本番なら共有)
- [ ] SQL Editor で以下のマイグレーションを順番に実行
  1. `supabase/migrations/0001_init.sql`
  2. `supabase/migrations/0002_xcloud_flow.sql`
  3. `supabase/migrations/0003_multi_industry.sql`
  4. `supabase/migrations/0004_multitenant_xcloud_flow.sql`
  5. `supabase/migrations/0005_audit_and_brand.sql`
  6. `supabase/migrations/0006_enterprise_features.sql`
  7. `supabase/migrations/0007_production_hardening.sql`
- [ ] (任意) 確認用デモを使う場合は `supabase/seed/production-demo.sql` を実行
- [ ] Auth → Email Auth が有効
- [ ] Auth → Site URL を `https://xcloud-flow.vercel.app` (本番) に設定
- [ ] Redirect URLs に `https://xcloud-flow.vercel.app/**` を追加
- [ ] Database → Roles で anon に SELECT/INSERT 権限が付与されている

## 2. Vercel

- [ ] GitHub `wishr-developer/xcloud-flow` を連携 (main ブランチ)
- [ ] Project Name = `XCloud-Flow`
- [ ] Framework = Next.js (自動検出)
- [ ] Environment Variables (Production / Preview の両方):
  - 必須:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_SITE_URL`
  - 任意:
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `STRIPE_PRICE_STARTER`
    - `STRIPE_PRICE_PRO`
    - `LINE_WEBHOOK_URL`
    - `OPENAI_API_KEY`
    - `OPENAI_MODEL` (デフォルト `gpt-4o-mini`)
    - `SUPABASE_SERVICE_ROLE_KEY` (Webhook 用)
- [ ] Domains に `xcloud-flow.vercel.app` (apex) が紐付いている
- [ ] (カスタムドメイン) 例 `studio-a.xcloud-flow.app` を追加し、Supabase で `organizations.custom_domain` を設定

## 3. Stripe (任意)

- [ ] Stripe 本番モードで `Starter` / `Pro` プランの Price を作成
- [ ] Price ID を Vercel に `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` として登録
- [ ] Customer Portal を有効化 (https://dashboard.stripe.com/settings/billing/portal)
- [ ] Webhook エンドポイントを追加:
  - URL: `https://xcloud-flow.vercel.app/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Signing Secret を `STRIPE_WEBHOOK_SECRET` に設定

## 4. OpenAI (任意)

- [ ] `OPENAI_API_KEY` を Vercel に設定
- [ ] (任意) `OPENAI_MODEL` を `gpt-4o-mini` または好みのモデルに設定
- [ ] 未設定でも `/api/ai/booking-assistant` `/api/ai/support-assistant` はルールベースで動作

## 5. LINE (任意)

- [ ] LINE Notify or Webhook URL を `LINE_WEBHOOK_URL` に設定
- [ ] 未設定の場合は `notification_logs` に `status='skipped'` で残るだけ
- [ ] `/admin/notifications` で送信履歴を確認

## 6. SEO

- [ ] `https://xcloud-flow.vercel.app/sitemap.xml` が 200 を返す
- [ ] `https://xcloud-flow.vercel.app/robots.txt` が 200 を返す
- [ ] `/industries/yoga` 等の OG / metadata が Twitter Card Validator で正しく見える
- [ ] Search Console に sitemap を登録

## 7. PWA

- [ ] `https://xcloud-flow.vercel.app/manifest.webmanifest` が 200 を返す
- [ ] (任意) `/public/icon.svg` を独自ロゴに差し替え
- [ ] (任意) Apple touch icon を差し替え (`<link rel="apple-touch-icon">`)

## 8. Security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` が `NEXT_PUBLIC_*` で公開されていない
- [ ] `/api/stripe/webhook` の署名検証を有効化したい場合は `STRIPE_WEBHOOK_SECRET` を設定
- [ ] `STRIPE_SECRET_KEY` `OPENAI_API_KEY` は Server-only (clientから参照されていない)
- [ ] middleware が `_next/static`, `_next/image`, 画像ファイルを除外している (`middleware.ts`)
- [ ] `/admin/*` は `app/admin/layout.tsx` で role guard (`admin`/`staff`/`teacher`)

## 9. Tenant isolation (重要)

`0007_production_hardening.sql` 適用後に、以下の手動テストを実施してください。

- [ ] 2 つの異なるメールでサインアップし、別々の組織を作成
- [ ] アカウント A で `/admin/bookings` を開き、データが見えていることを確認
- [ ] アカウント B でログインし、A の予約データが **見えない** ことを確認
- [ ] A から `/admin/site-config` で文言変更 → B の管理画面に影響しない
- [ ] /x/[slug] 公開ページは互いに閲覧可能 (`organizations.status='active'` のみ)
- [ ] 招待リンク (`/invite/<token>`) は token を知っていればログイン後に accept できる

## 10. Smoke test

```bash
npm install
npm run lint
npm run build
```

その後、本番 (`https://xcloud-flow.vercel.app`) で以下を確認:

- [ ] `/`
- [ ] `/pricing`
- [ ] `/industries/yoga`, `/industries/sports`
- [ ] `/signup` → `/onboarding` → `/onboarding/done` → `/admin`
- [ ] `/login`
- [ ] `/x/<your-slug>`
- [ ] `/book/chat`
- [ ] `/admin/system-status` (デプロイ後の正解)
- [ ] `/api/health` (JSON で `ok: true`)
- [ ] `/sitemap.xml` `/robots.txt` `/manifest.webmanifest`

## 11. Rollback

- Vercel は自動的に直前のデプロイを保持しているため、`Promote to Production` で 1 コマンド rollback 可能。
- Supabase マイグレーションは可逆ではない可能性があるため、`pg_dump` でスナップショットを取った上で適用してください。
- 招待 / Stripe Webhook イベントは Supabase の `audit_logs` テーブルに残ります。

## 12. Known limitations (β段階)

- メール送信 (招待・予約確認) は notification_logs に skip で残るだけ。Resend / SendGrid を別途配線する必要あり。
- カスタムドメインは "1 organization につき 1 ドメイン" のみ対応 (複数ドメイン → 同一 org 共有は未対応)。
- Stripe Webhook の署名検証は最小実装。本番では `STRIPE_WEBHOOK_SECRET` を設定し、署名検証ロジックを強化することを推奨。
- 監査ログのローテーション (削除/エクスポート) は未実装。テーブルサイズに応じて定期メンテナンスを推奨。

## 13. Tag

```bash
git tag -a v0.1.0-beta -m "XCloud-Flow first β release"
git push origin v0.1.0-beta
```
