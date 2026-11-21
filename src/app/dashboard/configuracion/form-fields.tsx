"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, Textarea, Label, FieldError, FieldHint } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Piezas de formulario compartidas por el registro y los ajustes del negocio.
 *
 * Los dos formularios piden los mismos datos y deben mostrar los mismos
 * errores, así que el cableado de accesibilidad (label asociado, `aria-invalid`
 * y `aria-describedby` apuntando al mensaje) se hace en un solo sitio: cuando
 * estaba suelto en cada campo, el error se pintaba pero el lector de pantalla
 * no lo relacionaba con el input.
 */

interface FieldProps {
  /** Se usa como `id` y, salvo que se indique otro, como `name`. */
  id: string;
  name?: string;
  label: string;
  hint?: React.ReactNode;
  /** Mensaje devuelto por el servidor para este campo. */
  error?: string;
}

function useFieldAria(id: string, hint: React.ReactNode, error?: string) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return {
    hintId,
    errorId,
    // El error va primero: es lo que importa escuchar al enfocar el campo.
    describedBy: [errorId, hintId].filter(Boolean).join(" ") || undefined,
  };
}

export function TextField({
  id,
  name,
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name">) {
  const { hintId, errorId, describedBy } = useFieldAria(id, hint, error);
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
    </div>
  );
}

export function TextAreaField({
  id,
  name,
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "name">) {
  const { hintId, errorId, describedBy } = useFieldAria(id, hint, error);
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
    </div>
  );
}

/**
 * Marca si un bloque de datos se publica o se queda en el panel.
 *
 * Hasta ahora el dueño llenaba cuatro campos sin saber a dónde iban. Con una
 * página pública de por medio, "quién va a leer esto" es la primera pregunta
 * de cada sección, y se responde en el propio encabezado.
 */
export function VisibilityTag({ visible }: { visible: boolean }) {
  const Icon = visible ? Eye : EyeOff;
  return (
    <span className="t-label inline-flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      {visible ? "Se ve en tu página" : "Sólo para ti"}
    </span>
  );
}

/** Bloque de campos con título, explicación y marca de visibilidad. */
export function FormSection({
  id,
  title,
  description,
  visibility,
  divider = true,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  visibility?: "public" | "private";
  /** Regla de separación superior. La primera sección no la necesita. */
  divider?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("space-y-4", divider && "rule-t pt-6", className)}
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id={id} className="t-h2">
            {title}
          </h2>
          {visibility && <VisibilityTag visible={visibility === "public"} />}
        </div>
        {description && <p className="t-small text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Casilla con marco, estado leído de un vistazo y explicación de la
 * consecuencia. Mismo patrón que la casilla de publicación del catálogo
 * (`catalogos/[id]/catalog-editor.tsx`), para no inventar otro control.
 *
 * El `<input type="hidden" value="false">` va ANTES del checkbox a propósito:
 * un checkbox desmarcado no se envía, y sin ese valor explícito desmarcar la
 * casilla no tenía ningún efecto al guardar.
 */
export function CheckboxCard({
  id,
  name,
  checked,
  onChange,
  title,
  children,
  icon,
  tone = "neutral",
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  title: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  /** `on` resalta la casilla cuando está marcada (publicación). */
  tone?: "neutral" | "on";
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-theme-sm)] border p-3 transition-colors",
        tone === "on" && checked ? "border-primary bg-primary/5" : "border-border bg-muted",
      )}
    >
      {/* El input va dentro del label (asociación implícita), como en el
          editor de catálogo: así toda la ficha es área de clic. */}
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input type="hidden" name={name} value="false" />
        <input
          id={id}
          type="checkbox"
          name={name}
          value="true"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-semibold">
            {icon}
            {title}
          </span>
          {children && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{children}</span>
          )}
        </span>
      </label>
    </div>
  );
}
