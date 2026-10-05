import Link from "next/link";
import { cn } from "@/lib/utils";

export interface StatTile {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "primary" | "accent" | "muted";
}

/** Fila compacta de métricas. Se vuelve enlace si se pasa `href`. */
export function StatTiles({ items }: { items: StatTile[] }) {
  return (
    <dl
      className={cn(
        "grid gap-3",
        items.length >= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {items.map((item) => {
        const body = (
          <div
            className={cn(
              "h-full rounded-[var(--radius-theme)] border border-border bg-card p-4",
              item.href && "transition-shadow hover:shadow-soft",
            )}
          >
            <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                "mt-1 font-heading text-2xl font-bold leading-none tabular-nums",
                item.tone === "accent" && "text-accent",
                item.tone === "primary" && "text-primary",
              )}
            >
              {item.value}
            </dd>
            {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
          </div>
        );

        return (
          <div key={item.label}>
            {item.href ? <Link href={item.href}>{body}</Link> : body}
          </div>
        );
      })}
    </dl>
  );
}
