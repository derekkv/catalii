import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "icon";

/*
 * Botón.
 *
 * Cambios respecto a la versión anterior y por qué:
 *  · `hover:opacity-90` → oscurecido real con color-mix. Bajar la opacidad
 *    deja ver el fondo a través del botón y lo desaturura; el resultado se
 *    percibe como un botón deshabilitado, no como un hover.
 *  · Sin sombra en el primario. Es un bloque de tinta; la jerarquía la da el
 *    contraste, no la elevación.
 *  · Desplazamiento de 1 px al pulsar: feedback táctil inmediato sin mover el
 *    layout de alrededor.
 */
const base = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
  "font-medium rounded-[var(--radius-theme-sm)]",
  "cursor-pointer transition-[background-color,border-color,color,translate] duration-150",
  "focus-visible:outline-none active:translate-y-px",
  "disabled:pointer-events-none disabled:opacity-45",
].join(" ");

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]",
  accent:
    "bg-accent text-on-accent hover:bg-[color-mix(in_srgb,var(--accent)_88%,black)]",
  outline:
    "border border-input bg-transparent text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  destructive:
    "bg-destructive text-on-destructive hover:bg-[color-mix(in_srgb,var(--destructive)_88%,black)]",
  // Enlace con forma de botón: para acciones secundarias dentro de un texto.
  link: "text-primary underline underline-offset-[0.22em] decoration-1 hover:decoration-2 px-0",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[0.8125rem]",
  md: "h-11 px-4 text-sm",
  lg: "h-13 px-6 text-[0.9375rem]",
  icon: "size-11", // >= 44 px táctil
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variants[variant],
        variant === "link" ? "h-auto p-0" : sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
