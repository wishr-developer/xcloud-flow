"use client";

import dynamic from "next/dynamic";

// Defer the install prompt code; it only matters after the browser fires
// `beforeinstallprompt`, so we don't need it in the initial bundle.
const InstallPrompt = dynamic(
  () =>
    import("./install-prompt").then((m) => m.InstallPrompt),
  { ssr: false, loading: () => null }
);

export function DeferredInstallPrompt() {
  return <InstallPrompt />;
}
