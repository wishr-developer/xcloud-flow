import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/site/bottom-nav";
import { DeferredInstallPrompt } from "@/components/site/deferred-install-prompt";
import { ToastProvider, ToastBridge } from "@/components/ui/toast";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xcloud-flow.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "XCloud Flow — 予約・受講管理・決済・通知・AI をひとつに",
    template: "%s | XCloud Flow",
  },
  description:
    "XCloud Flow は、スクール・教室・スタジオ・ジム・研修事業のための予約 × 受講管理 × 決済 × 通知 × AI を統合したオールインワン SaaS。学習、スポーツ、料理、音楽、語学、ダンス、ヨガ、フィットネス、アート、ビジネス研修まで、あらゆる業態に対応します。",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "XCloud Flow",
    description:
      "予約、受講管理、決済、通知、AI対応をひとつに。あらゆるスクール業態のための統合 SaaS。",
    type: "website",
    url: SITE_URL,
    siteName: "XCloud Flow",
    images: [{ url: "/og-default.svg", width: 1200, height: 630, alt: "XCloud Flow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "XCloud Flow",
    description: "予約、受講管理、決済、通知、AI対応をひとつに。",
    images: ["/og-default.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background pb-16 font-sans antialiased md:pb-0">
        <ToastProvider>
          <ToastBridge />
          {children}
          <BottomNav />
          <DeferredInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
