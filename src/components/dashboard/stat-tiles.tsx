import Link from "next/link";
import { cn } from "@/lib/utils";

export interface StatTile {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "primary" | "accent" | "muted";
}

/**
 * Fila de métricas, maquetada como la tabla de cifras de un periódico:
 * rótulo en versalitas, cifra monoespaciada y reglas verticales entre
 * columnas. Sin fichas flotantes ni iconos en cuadrados de color.
 */
export function StatTiles({ items }: { items: StatTile[] }) {
  return (
    <dl
      className={cn(
        "grid border-y border-border",
        items.length >= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {items.map((item, i) => {
        const body = (
          <div
            className={cn(
              "h-full px-4 py-4",
              item.href && "transition-colors hover:bg-muted",
            )}
          >
            <dt className="t-label text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                "t-num mt-2 text-2xl leading-none",
                item.tone === "accent" && "text-accent",
                item.tone === "primary" && "text-primary",
              )}
            >
              {item.value}
            </dd>
            {item.hint && <p className="t-small mt-1.5 text-muted-foreground">{item.hint}</p>}
          </div>
        );

        return (
          <div
            key={item.label}
            className={cn(
              // Reglas interiores sin dobles líneas en los extremos.
              i % 2 === 1 && "border-l border-border",
              items.length >= 4 && i >= 2 && "border-t border-border md:border-t-0",
              items.length >= 4 && "md:border-l md:[&:nth-child(4n+1)]:border-l-0",
            )}
          >
            {item.href ? <Link href={item.href}>{body}</Link> : body}
          </div>
        );
      })}
    </dl>
  );
}
