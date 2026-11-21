import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto de la página del negocio.
 *
 * Mismo motivo que en el catálogo: el enlace llega por WhatsApp y a menudo se
 * abre con mala conexión. Un armazón con la forma final se percibe más rápido
 * que una pantalla en blanco.
 */
export default function BusinessLoading() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true">
      <span className="sr-only">Cargando la página del negocio…</span>

      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Skeleton className="size-10" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <Skeleton className="mt-4 aspect-[3/1] w-full rounded-none" />

        <div className="space-y-3 pt-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-4 w-full max-w-prose" />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
