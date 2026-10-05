import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "muted" | "success" | "warning" | "danger" | "outline";

/*
 * Etiqueta de estado.
 *
 * Deja de ser una píldora de color saturado y pasa a ser una micro-etiqueta en
 * versalitas monoespaciadas con un filete de tinta a la izquierda: el recurso
 * con el que una ficha técnica impresa marca estados. Se lee igual de rápido,
 * pesa mucho menos visualmente y no compite con el contenido.
 */
const tones: Record<Tone, string> = {
  primary: "text-primary before:bg-primary",
  accent: "text-accent before:bg-accent",
  muted: "text-muted-foreground before:bg-muted-foreground",
  success: "text-success before:bg-success",
  warning: "text-warning before:bg-warning",
  danger: "text-destructive before:bg-destructive",
  outline: "text-foreground before:bg-foreground",
};

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "t-label inline-flex items-center gap-1.5 whitespace-nowrap",
        // Filete vertical de 2 px: el acento de color, sin relleno.
        "before:h-3 before:w-0.5 before:flex-none before:content-['']",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * Variante con relleno, para cuando el estado debe destacar por encima del
 * contenido (p. ej. "Agotado" sobre la foto de un producto).
 */
const solidTones: Record<Tone, string> = {
  primary: "bg-primary text-on-primary",
  accent: "bg-accent text-on-accent",
  muted: "bg-muted text-muted-foreground",
  success: "bg-success text-on-success",
  warning: "bg-warning text-on-warning",
  danger: "bg-destructive text-on-destructive",
  outline: "border border-input text-foreground",
};

export function BadgeSolid({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "t-label inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-theme-sm)] px-2 py-1",
        solidTones[tone],
        className,
      )}
      {...props}
    />
  );
}
