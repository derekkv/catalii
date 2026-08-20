import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "muted" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  primary: "bg-primary text-on-primary",
  accent: "bg-accent text-on-accent",
  muted: "bg-muted text-muted-foreground",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-black",
  danger: "bg-destructive text-on-destructive",
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
