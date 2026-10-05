"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Primitivas de superposición accesibles (modal y drawer).
 *
 * Resuelve lo que faltaba en los overlays hechos a mano del proyecto:
 *  - Cierre con Escape.
 *  - Bloqueo del scroll del body mientras está abierto (sin salto por scrollbar).
 *  - Foco inicial dentro del diálogo y trampa de foco (Tab circular).
 *  - Devolución del foco al elemento que lo abrió al cerrar.
 *  - aria-modal + aria-labelledby enlazado al título real.
 *
 * No usa portal a propósito: el catálogo público aplica el theme con
 * `data-theme` en un contenedor, así que el overlay debe quedar dentro del
 * árbol para heredar los tokens de color.
 */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Bloquea el scroll del documento compensando el ancho de la scrollbar. */
function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const gap = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [active]);
}

/** Escape para cerrar + trampa de foco + restauración del foco previo. */
function useDialogBehavior(
  active: boolean,
  onClose: () => void,
  ref: React.RefObject<HTMLDivElement | null>,
) {
  React.useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Foco inicial: primer control del diálogo, o el contenedor.
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      } else if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active, onClose, ref]);
}

interface BaseOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Título visible; se usa como nombre accesible del diálogo. */
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Oculta la X de la cabecera (p. ej. confirmaciones con botones propios). */
  hideClose?: boolean;
}

/** Panel lateral deslizante. Ideal para carrito y formularios largos. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideClose,
}: BaseOverlayProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  // `React.useId` (no un contador de módulo) para que el id del título
  // coincida entre el HTML del servidor y la hidratación del cliente.
  const baseId = React.useId();
  const titleId = `${baseId}-drawer-title`;
  const descId = `${baseId}-drawer-desc`;
  useScrollLock(open);
  useDialogBehavior(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-up"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-background shadow-soft outline-none",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-lg font-bold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && <div className="border-t border-border p-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Diálogo centrado. Para confirmaciones y detalles cortos. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideClose,
}: BaseOverlayProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const baseId = React.useId();
  const titleId = `${baseId}-modal-title`;
  const descId = `${baseId}-modal-desc`;
  useScrollLock(open);
  useDialogBehavior(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full max-w-lg animate-fade-up flex-col",
          "rounded-t-[var(--radius-theme-lg)] border border-border bg-card text-card-foreground shadow-soft outline-none",
          "sm:rounded-[var(--radius-theme-lg)]",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-lg font-bold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
