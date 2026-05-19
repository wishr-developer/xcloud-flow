"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

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

  if (!deferred || dismissed) return null;

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
              onClick={() => setDismissed(true)}
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
