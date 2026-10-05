import type { ThemeMeta } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Muestra de theme.
 *
 * Antes era un círculo con un degradado de primary→accent, repetido a mano en
 * cuatro formularios. Dos problemas: el degradado no existe en ningún theme
 * (mentía sobre el resultado) y era el último vestigio de ese recurso en la
 * app.
 *
 * Ahora son bandas de tinta contiguas —papel, color principal, acento— como
 * las tiras de prueba de color de una imprenta. Muestra los colores reales y
 * en su proporción aproximada de uso.
 */
export function ThemeSwatch({
  theme,
  className,
}: {
  theme: ThemeMeta;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-6 w-10 overflow-hidden rounded-[2px] border border-border",
        className,
      )}
    >
      <span className="h-full flex-1" style={{ background: theme.swatch.background }} />
      <span className="h-full flex-[1.4]" style={{ background: theme.swatch.primary }} />
      <span className="h-full w-1.5" style={{ background: theme.swatch.accent }} />
    </span>
  );
}

/** Variante para la opción "heredar del negocio" (sin theme propio). */
export function ThemeSwatchInherit({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-6 w-10 items-center justify-center rounded-[2px] border border-dashed border-input bg-muted",
        className,
      )}
    >
      <span className="t-label text-[0.5rem] text-muted-foreground">AUTO</span>
    </span>
  );
}
