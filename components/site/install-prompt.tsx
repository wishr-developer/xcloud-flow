"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Show install prompt only after the visitor is engaged (past LP hero),
// so the modal-like dialog does not steal focus from the primary
// "無料ではじめる" CTA on first visit. Also persist dismissal to avoid
// re-firing on every navigation.
const ENGAGED_ROUTES = ["/courses", "/pricing", "/my", "/book", "/faq"];
const ENGAGE_DELAY_MS = 30_000;
const DISMISS_KEY = "xcf.installPrompt.dismissedAt";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        onPrompt as EventListener
      );
  }, []);

  // Rehydrate dismissal from localStorage (7-day TTL).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const at = Number(raw);
        if (Number.isFinite(at) && Date.now() - at < DISMISS_TTL_MS) {
          setDismissed(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Gate: only show once the visitor has left the LP hero
  // (either navigated to an engaged route, or spent enough time on site).
  useEffect(() => {
    if (pathname && ENGAGED_ROUTES.some((r) => pathname.startsWith(r))) {
      setEngaged(true);
      return;
    }
    const t = window.setTimeout(() => setEngaged(true), ENGAGE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  function persistDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (!deferred || dismissed || !engaged) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-[120px] z-30 mx-auto max-w-md rounded-2xl border bg-white p-3 shadow-xl md:bottom-4"
      role="dialog"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">アプリとしてインストール</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ホーム画面に追加してアプリのように利用できます。
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                await deferred.prompt();
                const choice = await deferred.userChoice;
                if (choice.outcome === "accepted") {
                  setDeferred(null);
                } else {
                  setDismissed(true);
                }
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              インストール
            </button>
            <button
              onClick={persistDismiss}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-slate-100"
            >
              あとで
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="閉じる"
          className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
