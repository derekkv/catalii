"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Notificaciones efímeras.
 *
 * Antes, el feedback de las server actions era texto inline que aparecía y
 * nunca desaparecía (y que en móvil quedaba fuera de pantalla). Aquí el aviso
 * es global, se autodescarta y se anuncia a lectores de pantalla mediante una
 * región aria-live (`assertive` para errores, `polite` para el resto).
 */

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (message: string, options?: { tone?: ToastTone; duration?: number; action?: ToastItem["action"] }) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
});

const ICONS: Record<ToastTone, React.ElementType> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: "text-primary",
  error: "text-destructive",
  info: "text-muted-foreground",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    (message, options) => {
      const id = ++nextId;
      const tone = options?.tone ?? "info";
      // Los errores se quedan más tiempo: el usuario necesita leerlos y actuar.
      const duration = options?.duration ?? (tone === "error" ? 7000 : 4000);
      setItems((prev) => [...prev.slice(-2), { id, tone, message, action: options?.action }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, { tone: "success" }),
      error: (message) => toast(message, { tone: "error" }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 sm:top-auto sm:bottom-0 sm:items-end sm:p-4"
        // Región viva: los lectores de pantalla anuncian cada aviso nuevo.
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3",
                "rounded-[var(--radius-theme)] border border-border bg-card p-3 text-card-foreground shadow-soft",
              )}
            >
              <Icon
                className={cn("mt-0.5 size-5 shrink-0", TONE_CLASS[item.tone])}
                aria-hidden="true"
              />
              <p className="min-w-0 flex-1 text-sm font-medium">{item.message}</p>
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    dismiss(item.id);
                  }}
                  className="shrink-0 cursor-pointer text-sm font-bold text-primary hover:underline"
                >
                  {item.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Descartar aviso"
                className="-m-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
