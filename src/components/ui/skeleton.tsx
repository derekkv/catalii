import { cn } from "@/lib/utils";

/**
 * Bloque de carga.
 *
 * `aria-hidden`: un lector de pantalla no debe anunciar cajas vacías. El estado
 * de carga se comunica con el `role="status"` del contenedor en cada loading.tsx.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius-theme-sm)] bg-muted", className)}
      {...props}
    />
  );
}
