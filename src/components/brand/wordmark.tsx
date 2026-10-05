import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

/**
 * Logotipo.
 *
 * Es texto, no un degradado. El `text-brand-gradient` anterior (relleno
 * degradado sobre las letras) es uno de los tics visuales más reconocibles de
 * las interfaces generadas: cuesta leerlo a tamaño pequeño, no sobrevive a la
 * impresión en una sola tinta y no significa nada.
 *
 * En su lugar: la palabra compuesta en la serif del sistema con interletraje
 * cerrado y un punto de tinta final, como la marca de un pie de imprenta.
 */
const SIZES = {
  sm: "text-lg",
  md: "text-[1.375rem]",
  lg: "text-3xl",
} as const;

export function Wordmark({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-heading font-semibold leading-none tracking-[-0.035em]",
        SIZES[size],
        className,
      )}
    >
      {siteConfig.name}
      {/* Punto de tinta: el único acento de color del logotipo. */}
      <span className="text-primary" aria-hidden="true">
        .
      </span>
    </span>
  );
}

/**
 * Monograma cuadrado para avatares (fallback cuando un catálogo no tiene logo).
 * Tinta plena con la inicial en serif: legible a 24 px y coherente impreso.
 */
export function Monogram({
  letter,
  className,
}: {
  letter: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center rounded-[var(--radius-theme-sm)] bg-primary font-heading font-semibold leading-none text-on-primary",
        className,
      )}
    >
      {letter.charAt(0).toUpperCase()}
    </span>
  );
}
