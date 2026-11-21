import type { MetricDay } from "@/lib/admin-stats";
import { DataTable, Td, Th, Tr } from "./ui";
import { formatCount, formatDayShort } from "./format";

/**
 * Evolución diaria de visitas y clics.
 *
 * Barras hechas con CSS puro (altura en porcentaje): ni dependencia de
 * gráficos ni JavaScript en el cliente. Treinta columnas en un contenedor
 * flexible se adaptan al ancho sin cálculos.
 *
 * Accesibilidad: el gráfico es decorativo a efectos de datos (`role="img"` con
 * un resumen) y debajo va la tabla con las cifras exactas dentro de un
 * `<details>`. Así la información no depende de ver colores ni alturas. El
 * `title` de cada columna sirve de apoyo con el ratón, no como único camino.
 */
export function MetricChart({ days }: { days: MetricDay[] }) {
  const totalViews = days.reduce((s, d) => s + d.views, 0);
  const totalClicks = days.reduce((s, d) => s + d.whatsappClicks, 0);
  const totalOrders = days.reduce((s, d) => s + d.ordersSent, 0);
  const max = Math.max(...days.map((d) => d.views + d.whatsappClicks), 1);

  const first = days[0];
  const last = days[days.length - 1];

  /** Altura en %: lo que no es cero se ve, aunque sea 1 sobre 10.000. */
  function height(value: number): string {
    if (value <= 0) return "0%";
    return `${Math.max(2, (value / max) * 100)}%`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <p className="t-small text-muted-foreground">
          <span className="t-num text-foreground">{formatCount(totalViews)}</span> visitas
        </p>
        <p className="t-small text-muted-foreground">
          <span className="t-num text-foreground">{formatCount(totalClicks)}</span> clics en
          WhatsApp
        </p>
        <p className="t-small text-muted-foreground">
          <span className="t-num text-foreground">{formatCount(totalOrders)}</span> pedidos
          enviados
        </p>
      </div>

      <div
        role="img"
        aria-label={
          `Serie de ${days.length} días, del ${formatDayShort(first.day)} al ${formatDayShort(last.day)} (UTC): ` +
          `${formatCount(totalViews)} visitas y ${formatCount(totalClicks)} clics en WhatsApp. ` +
          "Las cifras día por día están en la tabla que sigue."
        }
        className="mt-4 flex h-40 items-end gap-px border-b border-border"
      >
        {days.map((d) => (
          <div
            key={d.day}
            title={`${formatDayShort(d.day)}: ${formatCount(d.views)} visitas, ${formatCount(d.whatsappClicks)} clics`}
            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-px"
          >
            <div
              className="w-full bg-accent"
              style={{ height: height(d.whatsappClicks) }}
              aria-hidden="true"
            />
            <div
              className="w-full bg-primary"
              style={{ height: height(d.views) }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="t-label text-muted-foreground">{formatDayShort(first.day)}</span>
        <span className="t-label text-muted-foreground">{formatDayShort(last.day)} (UTC)</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="t-label flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-3 bg-primary" aria-hidden="true" /> Visitas
        </span>
        <span className="t-label flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-3 bg-accent" aria-hidden="true" /> Clics en WhatsApp
        </span>
      </div>

      <details className="mt-4">
        <summary className="t-label cursor-pointer text-primary">Ver las cifras por día</summary>
        <div className="mt-3">
          <DataTable
            caption={`Visitas y clics por día (${days.length} días, fechas UTC). Dato real: contadores de la tabla page_metric.`}
            minWidth="30rem"
          >
            <thead>
              <tr>
                <Th>Día (UTC)</Th>
                <Th numeric>Página del negocio</Th>
                <Th numeric>Catálogos</Th>
                <Th numeric>Clics WhatsApp</Th>
                <Th numeric>Pedidos enviados</Th>
              </tr>
            </thead>
            <tbody>
              {days
                .filter(
                  (d) => d.views + d.whatsappClicks + d.ordersSent > 0,
                )
                .reverse()
                .map((d) => (
                  <Tr key={d.day}>
                    <Th scope="row" className="t-num normal-case tracking-normal text-foreground">
                      {formatDayShort(d.day)}
                    </Th>
                    <Td numeric>{formatCount(d.businessViews)}</Td>
                    <Td numeric>{formatCount(d.catalogViews)}</Td>
                    <Td numeric>{formatCount(d.whatsappClicks)}</Td>
                    <Td numeric>{formatCount(d.ordersSent)}</Td>
                  </Tr>
                ))}
            </tbody>
          </DataTable>
          {totalViews + totalClicks + totalOrders === 0 && (
            <p className="t-small mt-3 text-muted-foreground">
              Ningún día de la ventana tiene datos.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
