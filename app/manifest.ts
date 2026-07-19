import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XCloud Flow — School Operations SaaS",
    short_name: "XCloud Flow",
    description:
      "予約 × 受講 × 決済 × 通知 × AI を統合したスクール運営SaaS",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    lang: "ja",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
