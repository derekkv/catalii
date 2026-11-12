import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Marca compuesta: símbolo V2 + logotipo tipográfico.
 *
 * Por qué no se usa el logo horizontal (`catalii-logo-v2-principal.svg`):
 * ese archivo trae el texto convertido a contornos con color fijo, así que no
 * se adapta a los cinco themes (en `noche` el texto quedaría invisible). Aquí
 * se combina el **símbolo** —una ilustración con sus propios colores, legible
 * sobre papel claro y sobre fondo oscuro— con <Wordmark>, que es texto real y
 * hereda `currentColor` y la serif del sistema.
 *
 * El símbolo se sirve como <img> estático desde `public/`: el proyecto no usa
 * `next/image` en ningún sitio y no hay motivo para introducirlo por un SVG de
 * 5 kB. Lleva `width`/`height` explícitos para que no haya salto de layout.
 *
 * Accesibilidad: cuando el símbolo va acompañado del wordmark el nombre
 * accesible lo aporta el texto, así que el símbolo es decorativo (`alt=""`).
 * Si se usa `symbolOnly`, el símbolo pasa a llevar el nombre, salvo que el
 * contexto ya lo dé (enlace con `aria-label` o texto al lado): para eso está
 * `decorative`.
 */
const SIZES = {
  sm: { px: 20, cls: "size-5", gap: "gap-2" },
  md: { px: 26, cls: "size-[1.625rem]", gap: "gap-2.5" },
  lg: { px: 36, cls: "size-9", gap: "gap-3" },
} as const;

export function BrandLogo({
  size = "md",
  symbolOnly = false,
  decorative,
  className,
}: {
  size?: keyof typeof SIZES;
  /** Solo el símbolo, sin el logotipo tipográfico (espacios estrechos). */
  symbolOnly?: boolean;
  /**
   * El contexto ya aporta el nombre accesible. Por defecto: verdadero cuando
   * el wordmark acompaña al símbolo, falso cuando va solo.
   */
  decorative?: boolean;
  className?: string;
}) {
  const { px, cls, gap } = SIZES[size];
  const isDecorative = decorative ?? !symbolOnly;

  const symbol = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/catalii-simbolo-v2.svg"
      alt={isDecorative ? "" : siteConfig.name}
      width={px}
      height={px}
      draggable={false}
      className={cn("shrink-0 select-none", cls)}
      {...(isDecorative ? { "aria-hidden": true } : {})}
    />
  );

  if (symbolOnly) {
    return <span className={cn("inline-flex items-center", className)}>{symbol}</span>;
  }

  return (
    <span className={cn("inline-flex items-center", gap, className)}>
      {symbol}
      <Wordmark size={size} />
    </span>
  );
}
