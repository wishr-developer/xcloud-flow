import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "XCloud Flow — オンライン学習 × 予約 × 決済の統合プラットフォーム",
    template: "%s | XCloud Flow",
  },
  description:
    "XCloud Flow は、e-ラーニング講座・対面/オンライン予約・LINE通知・決済・CRM・スクール管理をひとつにまとめたSaaSです。",
  metadataBase: new URL("https://xcloud-flow.vercel.app"),
  openGraph: {
    title: "XCloud Flow",
    description:
      "オンライン講座と予約・決済を統合した次世代ラーニング/予約プラットフォーム",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
