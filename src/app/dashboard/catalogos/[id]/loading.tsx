import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto del editor de catálogo. Antes, entrar a un catálogo mostraba el
 * esqueleto genérico del panel (fichas de métricas + tabla), que no se parece
 * en nada al editor y daba sensación de "saltó a otra pantalla". Este armazón
 * tiene la forma real: cabecera, ajustes y lista de productos.
 */
export default function CatalogEditorLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-7" role="status" aria-busy="true">
      <span className="sr-only">Cargando catálogo…</span>

      {/* Cabecera */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Ajustes del catálogo */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-[var(--radius-theme-sm)]" />
          ))}
        </div>
      </div>

      {/* Lista de productos del catálogo */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
