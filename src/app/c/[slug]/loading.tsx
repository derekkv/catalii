import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto del catálogo público.
 *
 * Crítico para la conversión: el comprador abre el enlace desde WhatsApp, a
 * menudo con 3G. Un armazón con la forma final se percibe mucho más rápido que
 * una pantalla en blanco y reduce el abandono.
 */
export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true">
      <span className="sr-only">Cargando catálogo…</span>

      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Skeleton className="size-10" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <div className="py-3">
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="flex gap-2 pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="overflow-hidden rounded-[var(--radius-theme)] border border-border">
              <Skeleton className="aspect-square rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
