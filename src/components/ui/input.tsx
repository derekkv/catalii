import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Controles de formulario.
 *
 * El contorno usa `--input` (no `--rule`): un borde de control transmite
 * información —dónde se puede escribir— y debe cumplir 3:1 de contraste con
 * el fondo. La regla de pelo de los divisores no llega a ese valor, y usarla
 * aquí dejaba campos que casi no se veían sobre el papel.
 *
 * El foco pinta borde + anillo: el anillo solo se pierde contra fondos del
 * mismo tono.
 */
const field = [
  "w-full bg-card text-card-foreground",
  "rounded-[var(--radius-theme-sm)] border border-input",
  "text-sm placeholder:text-muted-foreground/70",
  "transition-[border-color,box-shadow] duration-150",
  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--ring)_28%,transparent)]",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-[color-mix(in_srgb,var(--destructive)_22%,transparent)]",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(field, "h-11 px-3", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(field, "min-h-24 px-3 py-2.5 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/**
 * Select nativo: en móvil abre el selector del sistema (mejor que cualquier
 * lista a medida) y ya es accesible por teclado. Sólo se le quita la flecha
 * nativa para dibujar un chevron propio con `currentColor`, de modo que siga
 * al theme sin incrustar un color fijo en un data-URI.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    style={{
      // Dos triángulos que forman una V. Se define en `style` porque son
      // cuatro propiedades acopladas (imagen, posición, tamaño, repetición)
      // y separarlas en utilidades las vuelve imposibles de mantener.
      backgroundImage:
        "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
      backgroundPosition: "right 1rem center, right 0.6875rem center",
      backgroundSize: "5px 5px, 5px 5px",
      backgroundRepeat: "no-repeat, no-repeat",
    }}
    className={cn(field, "h-11 cursor-pointer appearance-none pl-3 pr-9 font-medium", className)}
    {...props}
  />
));
Select.displayName = "Select";

/** Etiqueta de campo: versalitas monoespaciadas, como el rótulo de un formulario impreso. */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("t-label mb-2 block text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Texto de ayuda bajo un campo. */
export function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 t-small text-muted-foreground", className)} {...props} />;
}

/** Mensaje de error de campo o de formulario. */
export function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn(
        "mt-2 flex items-start gap-2 border-l-2 border-destructive bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-3 py-2 text-[0.8125rem] font-medium text-destructive",
        className,
      )}
      {...props}
    />
  );
}
