import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Medidor de consumo del plan.
 *
 * El gating por plan existía en el servidor pero el usuario no lo veía hasta
 * recibir un error al guardar. Mostrar el consumo (y avisar al acercarse)
 * convierte un error en una oportunidad de upgrade.
 */
export function UsageMeter({
  label,
  used,
  limit,
  upgradeHref,
}: {
  label: string;
  used: number;
  limit: number;
  upgradeHref?: string;
}) {
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const near = !unlimited && pct >= 80;
  const full = !unlimited && used >= limit;

  return (
    <div className="min-w-44 rounded-[var(--radius-theme-sm)] border border-border bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold tabular-nums">
          {used}
          {!unlimited && <span className="text-muted-foreground"> / {limit}</span>}
        </span>
      </div>

      {unlimited ? (
        <p className="mt-1 text-xs text-muted-foreground">Sin límite en tu plan</p>
      ) : (
        <>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label}: ${used} de ${limit}`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                full ? "bg-destructive" : near ? "bg-accent" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {near && upgradeHref && (
            <Link
              href={upgradeHref}
              className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline"
            >
              {full ? "Límite alcanzado — mejorar plan" : "Casi lleno — ver planes"}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
