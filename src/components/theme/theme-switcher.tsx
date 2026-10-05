"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Check, ChevronDown } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

/** Selector de theme para la app (persistente por usuario en localStorage). */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Cambiar apariencia"
        className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-theme-sm)] border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
      >
        <Palette className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Apariencias disponibles"
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right animate-fade-up rounded-[var(--radius-theme)] border border-border bg-card p-2 shadow-soft"
        >
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                // `menuitemradio` es el rol correcto para una selección única
                // dentro de un menú (antes se usaba listbox/option anidados en
                // <li>, combinación no válida para los lectores de pantalla).
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-theme-sm)] px-2 py-2 text-left transition-colors hover:bg-muted",
                  active && "bg-muted",
                )}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border"
                  style={{ background: t.swatch.background }}
                  aria-hidden="true"
                >
                  <span
                    className="size-4 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${t.swatch.primary}, ${t.swatch.accent})`,
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-card-foreground">
                    {t.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.description}
                  </span>
                </span>
                {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
