"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error";
}

interface ToastCtx {
  toast: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, ...t }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((x) => x.id !== id));
    }, 4000);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex max-w-md flex-col gap-2 px-3 md:bottom-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto rounded-md border bg-white px-4 py-3 text-sm shadow-lg " +
              (t.variant === "success"
                ? "border-emerald-200"
                : t.variant === "warning"
                  ? "border-amber-200"
                  : t.variant === "error"
                    ? "border-rose-200"
                    : "border-slate-200")
            }
          >
            <div className="font-medium">{t.title}</div>
            {t.description && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe no-op when used outside a provider
    return {
      toast: () => {
        /* no-op */
      },
    };
  }
  return ctx;
}

// Lightweight imperative API for client components without a provider.
type WindowWithToast = Window & { __xcloudToast?: (t: Omit<Toast, "id">) => void };

export function toast(t: Omit<Toast, "id">) {
  if (typeof window === "undefined") return;
  const fn = (window as WindowWithToast).__xcloudToast;
  if (fn) fn(t);
}

export function ToastBridge() {
  const { toast: toastFn } = useToast();
  useEffect(() => {
    (window as WindowWithToast).__xcloudToast = toastFn;
    return () => {
      delete (window as WindowWithToast).__xcloudToast;
    };
  }, [toastFn]);
  return null;
}
