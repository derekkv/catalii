import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { loadMetrics, METRIC_DAYS } from "@/lib/admin-stats";
import { METRIC_KINDS } from "@/lib/metrics/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import {
  DataNotes,
  DataTable,
  EmptyState,
  MetricsUnavailable,
  SectionHeading,
  SourceNote,
  Td,
  Th,
  Tr,
} from "../_components/ui";
import { MetricChart } from "../_components/metric-chart";
import {
  formatCount,
  formatCountry,
  formatDayShort,
  METRIC_KIND_LABEL,
} from "../_components/format";

export const metadata: Metadata = { title: "Métricas", robots: { index: false } };

export default async function AdminMetricsPage() {
  await requireAdmin();

  const { metrics, byBusiness, byCountry, from, to, notes } = await loadMetrics();
  const views = metrics.byKind.business_view + metrics.byKind.catalog_view;
  const countryTotal = byCountry.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Interno · solo lectura"
        title="Visitas y clics"
        description={`Del ${formatDayShort(from)} al ${formatDayShort(to)} (${METRIC_DAYS} días, fechas UTC).`}
      />

      <DataNotes notes={notes} />

      {!metrics.available ? (
        <MetricsUnavailable problem={metrics.problem} />
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
                hint:
                  views > 0
                    ? `${((metrics.byKind.whatsapp_click / views) * 100).toFixed(1)}% de las visitas`
                    : undefined,
                tone: "accent",
              },
              {
                label: "Negocios con actividad",
                value: formatCount(byBusiness.length),
                hint: `En los últimos ${METRIC_DAYS} días`,
              },
              {
                label: "Países",
                value: formatCount(byCountry.filter((c) => c.country !== null).length),
                hint: "Según la cabecera de Cloudflare",
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
              caption={`Totales por tipo de evento en los últimos ${METRIC_DAYS} días. Dato real: eventos de MongoDB contados por el backend.`}
              minWidth="26rem"
            >
              <thead>
                <tr>
                  <Th>Evento</Th>
                  <Th numeric>Total</Th>
                </tr>
              </thead>
              <tbody>
                {METRIC_KINDS.map((kind) => (
                  <Tr key={kind}>
                    <Th
                      scope="row"
                      className="normal-case tracking-normal text-sm font-normal text-foreground"
                    >
                      {METRIC_KIND_LABEL[kind]}
                    </Th>
                    <Td numeric>{formatCount(metrics.byKind[kind])}</Td>
                  </Tr>
                ))}
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
                caption="Visitas y clics por negocio en la ventana. Dato real: el backend agrupa los eventos por businessId y el nombre sale de la tabla business."
                minWidth="40rem"
              >
                <thead>
                  <tr>
                    <Th>Negocio</Th>
                    <Th numeric>Visitas</Th>
                    <Th numeric>Clics WhatsApp</Th>
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
                            Negocio borrado ({row.businessSlug ?? `${row.businessId.slice(0, 8)}…`})
                          </span>
                        )}
                      </Th>
                      <Td numeric>{formatCount(row.views)}</Td>
                      <Td numeric>{formatCount(row.clicks)}</Td>
                      <Td numeric>
                        {row.views > 0 ? `${((row.clicks / row.views) * 100).toFixed(1)}%` : "—"}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </section>

          <section aria-labelledby="por-pais">
            <SectionHeading
              id="por-pais"
              title="Por país"
              description="De dónde se conecta quien visita, según la red, no según lo que escribe nadie."
            />
            {byCountry.length === 0 ? (
              <EmptyState>
                Ningún evento de la ventana trae país. Es lo normal fuera de Cloudflare: la
                cabecera <code className="t-num">CF-IPCountry</code> la pone su red, así que en
                desarrollo local no existe.
              </EmptyState>
            ) : (
              <DataTable
                caption="Eventos por país en la ventana. Dato real: cabecera CF-IPCountry que Cloudflare añade a la petición; el porcentaje es sobre el total de eventos con y sin país."
                minWidth="30rem"
              >
                <thead>
                  <tr>
                    <Th>País</Th>
                    <Th numeric>Eventos</Th>
                    <Th numeric>Del total</Th>
                  </tr>
                </thead>
                <tbody>
                  {byCountry.map((row) => (
                    <Tr key={row.country ?? "sin-pais"}>
                      <Th scope="row" className="normal-case tracking-normal">
                        <span className="text-sm font-normal text-foreground">
                          {formatCountry(row.country)}
                        </span>
                        {row.country && (
                          <span className="t-label ml-2 font-normal text-muted-foreground">
                            {row.country}
                          </span>
                        )}
                      </Th>
                      <Td numeric>{formatCount(row.count)}</Td>
                      <Td numeric>
                        {countryTotal > 0
                          ? `${((row.count / countryTotal) * 100).toFixed(1)}%`
                          : "—"}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </section>

          <SourceNote>
            Todo lo de esta pantalla son{" "}
            <strong className="font-medium text-foreground">eventos sueltos</strong> guardados en
            MongoDB y servidos por el backend (<code className="t-num">back.catalii.com</code>). De
            cada evento se guardan el tipo, el negocio, el día, el país, el host del referrer y si
            el dispositivo era móvil: ni IP, ni navegador, ni identificador de visitante, ni
            cookies. Por eso{" "}
            <strong className="font-medium text-foreground">no hay visitantes únicos</strong>, ni
            sesiones: cinco visitas pueden ser cinco personas o una misma recargando. La relación
            «clics / visitas» es un cociente entre dos contadores, no una tasa de conversión por
            persona. Cualquiera puede llamar al contador en bucle desde el navegador, así que las
            cifras son indicativas, no auditables. Los pedidos enviados no están aquí: eso se
            cuenta sobre la tabla <code className="t-num">order</code> de Postgres, en{" "}
            <Link href="/admin/pedidos" className="link-ink text-primary">
              Pedidos
            </Link>
            .
          </SourceNote>
        </>
      )}
    </div>
  );
}
