import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { loadMetrics, METRIC_DAYS } from "@/lib/admin-stats";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { DataNotes, DataTable, EmptyState, SectionHeading, SourceNote, Td, Th, Tr } from "../_components/ui";
import { MetricChart } from "../_components/metric-chart";
import { formatCount, formatDayShort, METRIC_KIND_LABEL } from "../_components/format";

export const metadata: Metadata = { title: "Métricas", robots: { index: false } };

export default async function AdminMetricsPage() {
  await requireAdmin();

  const { metrics, byBusiness, from, to, notes } = await loadMetrics();
  const views = metrics.byKind.business_view + metrics.byKind.catalog_view;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Interno · solo lectura"
        title="Visitas y clics"
        description={`Del ${formatDayShort(from)} al ${formatDayShort(to)} (${METRIC_DAYS} días, fechas UTC).`}
      />

      <DataNotes notes={notes} />

      {!metrics.available ? (
        <div className="border-l-2 border-warning bg-muted/60 px-4 py-3">
          <p className="t-label text-warning">Métricas todavía no disponibles</p>
          <p className="t-small mt-2 text-muted-foreground">
            La tabla <code className="t-num">page_metric</code> no existe en la base de datos.
            Aplica{" "}
            <code className="t-num">supabase/migrations/0009_business_pages_and_metrics.sql</code>:
            desde ese momento se empiezan a contar visitas y clics. No hay histórico anterior que
            recuperar, porque hasta ahora no se guardaba nada.
          </p>
        </div>
      ) : (
        <>
          <StatTiles
            items={[
              {
                label: "Visitas",
                value: formatCount(views),
                hint: "Página de negocio + catálogos",
              },
              {
                label: "Clics en WhatsApp",
                value: formatCount(metrics.byKind.whatsapp_click),
                hint: views > 0 ? `${((metrics.byKind.whatsapp_click / views) * 100).toFixed(1)}% de las visitas` : undefined,
                tone: "accent",
              },
              {
                label: "Pedidos enviados",
                value: formatCount(metrics.byKind.order_sent),
                hint: "Contados al enviarse",
              },
              {
                label: "Negocios con actividad",
                value: formatCount(byBusiness.length),
                hint: `En los últimos ${METRIC_DAYS} días`,
              },
            ]}
          />

          <section aria-labelledby="evolucion">
            <SectionHeading
              id="evolucion"
              title="Evolución por día"
              description="Una columna por día; la parte superior son los clics en WhatsApp."
            />
            <MetricChart days={metrics.daily} />
          </section>

          <section aria-labelledby="por-tipo">
            <SectionHeading id="por-tipo" title="Por tipo de evento" />
            <DataTable
              caption={`Totales por tipo de evento en los últimos ${METRIC_DAYS} días. Dato real: suma de page_metric.count.`}
              minWidth="26rem"
            >
              <thead>
                <tr>
                  <Th>Evento</Th>
                  <Th numeric>Total</Th>
                </tr>
              </thead>
              <tbody>
                {(["business_view", "catalog_view", "whatsapp_click", "order_sent"] as const).map(
                  (kind) => (
                    <Tr key={kind}>
                      <Th scope="row" className="normal-case tracking-normal text-sm font-normal text-foreground">
                        {METRIC_KIND_LABEL[kind]}
                      </Th>
                      <Td numeric>{formatCount(metrics.byKind[kind])}</Td>
                    </Tr>
                  ),
                )}
              </tbody>
            </DataTable>
          </section>

          <section aria-labelledby="por-negocio">
            <SectionHeading
              id="por-negocio"
              title="Por negocio"
              description="Solo aparecen los negocios con al menos un evento en la ventana."
            />
            {byBusiness.length === 0 ? (
              <EmptyState>
                No hay ningún evento registrado en los últimos {METRIC_DAYS} días.
              </EmptyState>
            ) : (
              <DataTable
                caption="Visitas, clics y pedidos enviados por negocio en la ventana. Dato real: page_metric agrupada por business_id."
                minWidth="40rem"
              >
                <thead>
                  <tr>
                    <Th>Negocio</Th>
                    <Th numeric>Visitas</Th>
                    <Th numeric>Clics WhatsApp</Th>
                    <Th numeric>Pedidos enviados</Th>
                    <Th numeric>Clics / visitas</Th>
                  </tr>
                </thead>
                <tbody>
                  {byBusiness.map((row) => (
                    <Tr key={row.businessId}>
                      <Th scope="row" className="normal-case tracking-normal">
                        {row.business ? (
                          <Link
                            href={`/admin/negocios/${row.business.id}`}
                            className="link-ink text-sm font-medium"
                          >
                            {row.business.name}
                          </Link>
                        ) : (
                          <span className="t-small font-normal text-muted-foreground">
                            Negocio borrado ({row.businessId.slice(0, 8)}…)
                          </span>
                        )}
                      </Th>
                      <Td numeric>{formatCount(row.views)}</Td>
                      <Td numeric>{formatCount(row.clicks)}</Td>
                      <Td numeric>{formatCount(row.ordersSent)}</Td>
                      <Td numeric>
                        {row.views > 0 ? `${((row.clicks / row.views) * 100).toFixed(1)}%` : "—"}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </section>

          <SourceNote>
            Todo lo de esta pantalla son{" "}
            <strong className="font-medium text-foreground">contadores por día</strong> de la tabla{" "}
            <code className="t-num">page_metric</code>, que no guarda IP, ni navegador, ni
            identificador de visitante. Por eso no hay visitantes únicos, ni sesiones, ni de dónde
            llega el tráfico: cinco visitas pueden ser cinco personas o una misma recargando. La
            relación «clics / visitas» es un cociente entre dos contadores, no una tasa de
            conversión por persona. Cualquiera puede llamar al contador en bucle desde el
            navegador, así que las cifras son indicativas, no auditables (está asumido en la
            migración 0009).
          </SourceNote>
        </>
      )}
    </div>
  );
}
