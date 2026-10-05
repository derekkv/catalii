"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Hammer, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "catalii-dev-notice-dismissed";

/**
 * Aviso de "en desarrollo".
 *
 * Decisiones de UX (importantes):
 *  - NO bloquea la navegación: es una barra inferior, no un modal modal-encima-de-todo.
 *  - NUNCA aparece en catálogos públicos (`/c/*`): esas páginas las abren los
 *    clientes del mayorista y un aviso de "sitio en obras" destruye su confianza.
 *  - Se recuerda el cierre en localStorage (no reaparece en cada navegación).
 *  - Se puede desactivar sin tocar código con NEXT_PUBLIC_SHOW_DEV_NOTICE=false.
 */
export function DevBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const disabled =
    process.env.NEXT_PUBLIC_SHOW_DEV_NOTICE === "false" || pathname?.startsWith("/c/");

  useEffect(() => {
    if (disabled) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* almacenamiento no disponible */
    }
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [disabled]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
  }

  if (disabled || !visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3",
        "pointer-events-none animate-fade-up",
      )}
    >
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-[var(--radius-theme)] border border-border bg-card px-4 py-3 shadow-soft">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary"
          aria-hidden="true"
        >
          <Hammer className="size-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-card-foreground">
          <span className="font-semibold">Catalii está en desarrollo.</span>{" "}
          <span className="text-muted-foreground">
            Puede que encuentres funciones sin terminar.
          </span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
