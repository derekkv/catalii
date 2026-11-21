import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto del panel de administración.
 *
 * Cada pantalla lanza entre seis y once consultas en paralelo contra Supabase;
 * sin esto, la navegación deja la zona de contenido en blanco mientras tanto.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Cargando datos del panel…</span>

      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid grid-cols-2 gap-px border-y border-border md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>

      <Skeleton className="h-64" />
    </div>
  );
}
