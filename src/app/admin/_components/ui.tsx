import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Piezas compartidas de /admin.
 *
 * Mismo lenguaje visual que el panel del mayorista: reglas de pelo, cifras
 * monoespaciadas y micro-etiquetas en versalitas. Nada aquí recibe datos sin
 * consultar ni el cliente de servicio: son componentes de presentación.
 */

/**
 * Tabla de datos.
 *
 * · `caption` es obligatoria: describe la tabla para quien navega con lector
 *   de pantalla y, de paso, documenta de dónde salen las cifras.
 * · El contenedor con `overflow-x` lleva `tabIndex={0}` y `role="region"`:
 *   una zona desplazable que no se puede enfocar es inalcanzable con teclado.
 */
export function DataTable({
  caption,
  children,
  minWidth = "48rem",
}: {
  caption: React.ReactNode;
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div
      role="region"
      tabIndex={0}
      className="overflow-x-auto border-y border-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        <caption className="t-small rule-b px-3 py-2.5 text-left text-muted-foreground">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

/** Celda de encabezado. Siempre con `scope`, por accesibilidad. */
export function Th({
  children,
  scope = "col",
  numeric,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope={scope}
      className={cn(
        "t-label whitespace-nowrap px-3 py-2.5 align-bottom font-medium text-muted-foreground",
        numeric && "text-right",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  numeric,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn("px-3 py-3 align-middle", numeric && "t-num text-right", className)}
      {...props}
    >
      {children}
    </td>
  );
}

/** Fila con regla superior (la primera no la lleva: ya la pone el `thead`). */
export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("rule-t transition-colors hover:bg-muted", className)} {...props} />;
}

/**
 * Avisos sobre la procedencia o la integridad de los datos.
 *
 * Aparece cuando una consulta falló, cuando una tabla todavía no existe
 * (migraciones pendientes) o cuando una lectura se quedó en el tope de filas y
 * el desglose es parcial. Lleva icono y texto, no solo color.
 */
export function DataNotes({ notes, className }: { notes: string[]; className?: string }) {
  if (notes.length === 0) return null;
  return (
    <section
      aria-labelledby="avisos-datos"
      className={cn("border-l-2 border-warning bg-muted/60 px-4 py-3", className)}
    >
      <h2 id="avisos-datos" className="t-label flex items-center gap-2 text-warning">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
        Avisos sobre estos datos
      </h2>
      <ul className="t-small mt-2 space-y-1.5 text-muted-foreground">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <span aria-hidden="true">·</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** De dónde sale una cifra: tabla de origen y si es exacta o aproximada. */
export function SourceNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("t-small flex items-start gap-2 text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Encabezado de sección con enlace opcional a la vista completa. */
export function SectionHeading({
  title,
  description,
  aside,
  id,
}: {
  title: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div>
        <h2 id={id} className="t-h2">
          {title}
        </h2>
        {description && <p className="t-small mt-1 text-muted-foreground">{description}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Estado vacío, con el motivo explícito. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rule-t rule-b py-10 text-center text-sm text-muted-foreground">{children}</p>
  );
}

/**
 * Aviso de que las visitas y los clics no se pudieron leer.
 *
 * Las métricas viven en MongoDB, detrás del backend; el resto del panel sigue
 * en Postgres y funciona igual. Aquí se dice el motivo y **no se muestra
 * ninguna cifra**: un cero se leería como «no hubo visitas», que es otra cosa.
 * Lleva icono y texto, no solo el color del borde.
 */
export function MetricsUnavailable({ problem }: { problem?: string | null }) {
  return (
    <div className="border-l-2 border-warning bg-muted/60 px-4 py-3">
      <p className="t-label flex items-center gap-2 text-warning">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
        Métricas no disponibles
      </p>
      <p className="t-small mt-2 text-muted-foreground">
        {problem ??
          "El backend de métricas no respondió, así que no hay visitas ni clics que mostrar."}
      </p>
      <p className="t-small mt-2 text-muted-foreground">
        No se muestran ceros a propósito: cero querría decir «nadie visitó», y lo que pasa es que
        no se pudo preguntar. Las demás cifras de esta pantalla salen de Postgres y son correctas.
      </p>
    </div>
  );
}

/** Par rótulo/valor para las fichas de detalle. */
export function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="t-label text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1.5 break-words text-sm", mono && "t-num text-[0.8125rem]")}>
        {children}
      </dd>
    </div>
  );
}
