import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Medidor de consumo del plan.
 *
 * El límite por plan se aplicaba en el servidor pero el usuario no lo veía
 * hasta recibir un error al guardar. Mostrarlo convierte un error en una
 * oportunidad de mejora de plan.
 *
 * Forma: cifra monoespaciada y una regla que se rellena. Nada de barras
 * redondeadas con degradado.
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
    <div className="w-full min-w-36 max-w-56">
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-label text-muted-foreground">{label}</span>
        <span className="t-num text-sm">
          {used}
          {!unlimited && <span className="text-muted-foreground"> / {limit}</span>}
        </span>
      </div>

      {unlimited ? (
        <p className="t-small mt-1.5 text-muted-foreground">Sin límite</p>
      ) : (
        <>
          <div
            className="mt-2 h-px w-full bg-border"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label}: ${used} de ${limit}`}
          >
            <div
              className={cn(
                "h-px transition-[width] duration-500",
                full ? "bg-destructive" : near ? "bg-accent" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {near && upgradeHref ? (
            <Link href={upgradeHref} className="t-label link-ink mt-2 inline-block text-primary">
              {full ? "Límite alcanzado" : "Casi lleno"}
            </Link>
          ) : (
            <p className="t-small mt-1.5 text-muted-foreground">{pct}% usado</p>
          )}
        </>
      )}
    </div>
  );
}
