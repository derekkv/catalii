import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "muted" | "success" | "warning" | "danger" | "outline";

const tones: Record<Tone, string> = {
  primary: "bg-primary text-on-primary",
  accent: "bg-accent text-on-accent",
  muted: "bg-muted text-muted-foreground",
  // Tokens semánticos del theme (antes: bg-emerald-600 / bg-amber-500 fijos,
  // que en los themes oscuros quedaban fuera de paleta y con poco contraste).
  success: "bg-success text-on-success",
  warning: "bg-warning text-on-warning",
  danger: "bg-destructive text-on-destructive",
  outline: "border border-border text-foreground",
};

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
