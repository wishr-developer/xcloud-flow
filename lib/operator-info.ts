/**
 * Operator (platform) information surfaced on legal pages.
 *
 * These are read from environment variables so the owner can configure them
 * without editing code or running a migration:
 *
 *   NEXT_PUBLIC_LEGAL_BUSINESS_NAME=    e.g. "XCloud-Flow 株式会社"
 *   NEXT_PUBLIC_LEGAL_REPRESENTATIVE=   e.g. "代表取締役 沓澤 怜士"
 *   NEXT_PUBLIC_LEGAL_ADDRESS=          e.g. "東京都渋谷区..."
 *   NEXT_PUBLIC_LEGAL_PHONE=            e.g. "03-0000-0000"
 *   NEXT_PUBLIC_SUPPORT_EMAIL=          e.g. "support@xcloud-flow.app"
 *
 * Until those env vars are set, the legal pages render polite fallback text
 * ("請求があった場合に遅滞なく開示します。") so the site is still GA-launchable
 * the moment the owner publishes the company information.
 */

export interface OperatorInfo {
  businessName: string | null;
  representative: string | null;
  address: string | null;
  phone: string | null;
  supportEmail: string | null;
}

export function getOperatorInfo(): OperatorInfo {
  return {
    businessName:
      orNull(process.env.NEXT_PUBLIC_LEGAL_BUSINESS_NAME) ??
      orNull(process.env.LEGAL_BUSINESS_NAME),
    representative:
      orNull(process.env.NEXT_PUBLIC_LEGAL_REPRESENTATIVE) ??
      orNull(process.env.LEGAL_REPRESENTATIVE),
    address:
      orNull(process.env.NEXT_PUBLIC_LEGAL_ADDRESS) ??
      orNull(process.env.LEGAL_ADDRESS),
    phone:
      orNull(process.env.NEXT_PUBLIC_LEGAL_PHONE) ??
      orNull(process.env.LEGAL_PHONE),
    supportEmail:
      orNull(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) ??
      orNull(process.env.SUPPORT_EMAIL),
  };
}

function orNull(v: string | undefined): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}
