import type { PlanId } from "@/lib/types";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  monthlyPriceLabel: string;
  bookingLimit: number | "unlimited";
  highlights: string[];
  cta: string;
  popular?: boolean;
  enterprise?: boolean;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "まずは無料で運用イメージを掴めるプラン。",
    monthlyPrice: 0,
    monthlyPriceLabel: "¥0",
    bookingLimit: 10,
    highlights: [
      "月10件までの予約管理",
      "1管理者アカウント",
      "基本予約ページ",
      "業種テンプレート切替",
    ],
    cta: "無料ではじめる",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "個人スクール / 1教室の本格運営に。",
    monthlyPrice: 4980,
    monthlyPriceLabel: "¥4,980",
    bookingLimit: "unlimited",
    highlights: [
      "予約・受講管理 無制限",
      "顧客 (CRM) 管理",
      "通知ログ",
      "クーポン発行",
      "メール / LINE 通知",
    ],
    cta: "Starterを選ぶ",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "AI予約・Stripe決済・LINE通知まで本格運営に。",
    monthlyPrice: 19800,
    monthlyPriceLabel: "¥19,800",
    bookingLimit: "unlimited",
    highlights: [
      "Starterの全機能",
      "AIチャット予約 / 問い合わせ",
      "Stripe オンライン決済",
      "複数講師 / 複数拠点",
      "KPIダッシュボード",
      "修了証発行",
    ],
    cta: "Proを選ぶ",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "法人 / フランチャイズ / 多拠点運営に。",
    monthlyPrice: 0,
    monthlyPriceLabel: "ご相談",
    bookingLimit: "unlimited",
    highlights: [
      "Proの全機能",
      "複数法人 / マルチテナント",
      "カスタムSSO / SAML",
      "専任サポート",
      "SLA契約",
      "個別カスタマイズ",
    ],
    cta: "お問い合わせ",
    enterprise: true,
  },
];

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
