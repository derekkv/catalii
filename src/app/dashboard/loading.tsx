import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto del panel. Antes, cada navegación dejaba la pantalla en blanco
 * mientras se resolvían las consultas a Supabase (visible sobre todo en móvil).
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-theme)]" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 rounded-[var(--radius-theme)]" />
      </div>
    </div>
  );
}
