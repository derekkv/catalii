import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { adminConfigured, requireAdmin } from "@/lib/admin";
import { loadOverview, METRIC_DAYS } from "@/lib/admin-stats";
import { PLAN_ORDER } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { Badge } from "@/components/ui/badge";
import { DataNotes, DataTable, EmptyState, MetricsUnavailable, SectionHeading, SourceNote, Td, Th, Tr } from "./_components/ui";
import { MetricChart } from "./_components/metric-chart";
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatMoneyByCurrency,
  planName,
  PLAN_TONE,
  subscriptionStatusLabel,
  subscriptionStatusTone,
} from "./_components/format";

export const metadata: Metadata = { title: "Resumen", robots: { index: false } };

export default async function AdminOverviewPage() {
  // Primera instrucción, siempre: todo lo que viene después consulta con el
  // cliente de servicio, que salta RLS.
  await requireAdmin();

  const data = await loadOverview();
  const { businesses, plans, subscriptions, catalogs, products, orders, metrics } = data;

  const paidPct =
    businesses.total > 0 ? Math.round((data.paidBusinesses / businesses.total) * 100) : 0;

  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow="Interno · solo lectura"
        title="Estado del negocio"
        description={
          <>
            Cifras de toda la plataforma. Las fechas y los cortes de día están en{" "}
            <strong className="font-medium text-foreground">UTC</strong>, igual que los días de la
            serie de métricas. Ninguna pantalla de este panel escribe en la base de datos.
          </>
        }
      />

      {/*
        Defensa en profundidad. Con `requireAdmin()` cumplido esto no debería
        verse nunca (sin ADMIN_EMAILS nadie pasa del 404), pero si la
        autorización cambiara de criterio, el panel diría qué le falta en vez
        de mostrar los datos de todos los clientes como si nada.
      */}
      {!adminConfigured() && (
        <section className="border-l-2 border-destructive bg-muted/60 px-4 py-3">
          <h2 className="t-label text-destructive">Falta configurar ADMIN_EMAILS</h2>
          <p className="t-small mt-2 text-muted-foreground">
            La variable de entorno <code className="t-num">ADMIN_EMAILS</code> está vacía, así que
            no hay ninguna cuenta autorizada para este panel. Defínela en el servidor (correos
            separados por comas) y vuelve a desplegar.
          </p>
        </section>
      )}

      <DataNotes notes={data.notes} />

      {/* ══ Negocios ═══════════════════════════════════════════════════════ */}
      <section aria-labelledby="negocios">
        <SectionHeading
          id="negocios"
          title="Negocios"
          description="Cuántos se han registrado y a qué ritmo."
          aside={
            <Link
              href="/admin/negocios"
              className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
            >
              Ver listado <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <StatTiles
          items={[
            {
              label: "Negocios",
              value: formatCount(businesses.total),
              hint: "Registrados en total",
              href: "/admin/negocios",
            },
            {
              label: "Nuevos (7 días)",
              value: formatCount(businesses.last7),
              hint: "Alta desde hace 7 días",
            },
            {
              label: "Nuevos (30 días)",
              value: formatCount(businesses.last30),
              hint: "Alta desde hace 30 días",
            },
            {
              label: "De pago",
              value: formatCount(data.paidBusinesses),
              hint: `${paidPct}% del total`,
              tone: data.paidBusinesses > 0 ? "accent" : "muted",
            },
          ]}
        />
        <SourceNote className="mt-3">
          Dato real, contado sobre la tabla <code className="t-num">business</code>. «De pago» es
          la columna <code className="t-num">plan</code> distinta de «Gratis», que es lo que aplica
          los límites de la app; quién paga de verdad está en Suscripciones.
        </SourceNote>
      </section>

      {/* ══ Reparto por plan ═══════════════════════════════════════════════ */}
      <section aria-labelledby="planes">
        <SectionHeading id="planes" title="Reparto por plan" />
        <DataTable
          caption="Negocios por plan contratado (columna business.plan). Dato real."
          minWidth="24rem"
        >
          <thead>
            <tr>
              <Th>Plan</Th>
              <Th numeric>Negocios</Th>
              <Th numeric>Porcentaje</Th>
            </tr>
          </thead>
          <tbody>
            {PLAN_ORDER.map((tier) => {
              const count = plans[tier];
              const pct = businesses.total > 0 ? (count / businesses.total) * 100 : 0;
              return (
                <Tr key={tier}>
                  <Th scope="row" className="normal-case tracking-normal">
                    <Badge tone={PLAN_TONE[tier]}>{planName(tier)}</Badge>
                  </Th>
                  <Td numeric>{formatCount(count)}</Td>
                  <Td numeric>
                    {/* Barra + número: la proporción no depende solo del ancho. */}
                    <span className="flex items-center justify-end gap-2">
                      <span
                        aria-hidden="true"
                        className="hidden h-1.5 bg-primary sm:block"
                        style={{ width: `${Math.round(pct * 0.8)}%`, minWidth: pct > 0 ? 2 : 0 }}
                      />
                      {pct.toFixed(0)}%
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </DataTable>
      </section>

      {/* ══ Suscripciones ══════════════════════════════════════════════════ */}
      <section aria-labelledby="suscripciones">
        <SectionHeading
          id="suscripciones"
          title="Suscripciones"
          description="Estado en Paddle, tal como lo dejó el último webhook procesado."
          aside={
            <Link
              href="/admin/suscripciones"
              className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
            >
              Ver todas <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <StatTiles
          items={[
            { label: "Activas", value: formatCount(subscriptions.active), tone: "primary" },
            { label: "En prueba", value: formatCount(subscriptions.trialing) },
            {
              label: "En mora",
              value: formatCount(subscriptions.pastDue),
              hint: "Pago rechazado",
              tone: subscriptions.pastDue > 0 ? "accent" : "muted",
            },
            {
              label: "Canceladas",
              value: formatCount(subscriptions.canceled),
              hint: `${formatCount(subscriptions.total)} registradas en total`,
            },
          ]}
        />
        {(subscriptions.paused > 0 || subscriptions.other > 0) && (
          <p className="t-small mt-3 text-muted-foreground">
            Además: {formatCount(subscriptions.paused)} pausadas y{" "}
            {formatCount(subscriptions.other)} con un estado que este panel no traduce (se muestra
            el valor crudo de Paddle en el listado).
          </p>
        )}

        <h3 className="t-h3 mt-6 mb-3">Plazos: cambios ya programados</h3>
        {subscriptions.scheduled.length === 0 ? (
          <EmptyState>
            Ninguna suscripción tiene un cambio programado (
            <code className="t-num">scheduled_change_at</code> vacío en todas).
          </EmptyState>
        ) : (
          <DataTable
            caption="Suscripciones con cancelación o cambio programado, por fecha. Dato real: columna scheduled_change_at de paddle_subscription."
            minWidth="36rem"
          >
            <thead>
              <tr>
                <Th>Negocio</Th>
                <Th>Estado actual</Th>
                <Th>Fecha del cambio (UTC)</Th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.scheduled.map(({ subscription, business }) => (
                <Tr key={subscription.subscription_id}>
                  <Th scope="row" className="normal-case tracking-normal">
                    {business ? (
                      <Link href={`/admin/negocios/${business.id}`} className="link-ink text-sm">
                        {business.name}
                      </Link>
                    ) : (
                      <span className="t-small text-muted-foreground">
                        Sin negocio asociado ({subscription.subscription_id})
                      </span>
                    )}
                  </Th>
                  <Td>
                    <Badge tone={subscriptionStatusTone(subscription.status)}>
                      {subscriptionStatusLabel(subscription.status)}
                    </Badge>
                  </Td>
                  <Td>{formatDateTime(subscription.scheduled_change_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* ══ Plan que no cuadra con la suscripción ══════════════════════════ */}
      {data.mismatches.length > 0 && (
        <section aria-labelledby="descuadres">
          <SectionHeading
            id="descuadres"
            title="Planes que no cuadran"
            description="Diferencias entre la columna plan del negocio y su suscripción viva en Paddle. Revisar a mano."
          />
          <DataTable
            caption="Negocios cuyo plan no coincide con su suscripción. Dato real, cruce entre business.plan y paddle_subscription.status."
            minWidth="36rem"
          >
            <thead>
              <tr>
                <Th>Negocio</Th>
                <Th>Plan en la app</Th>
                <Th>Suscripción viva</Th>
              </tr>
            </thead>
            <tbody>
              {data.mismatches.map(({ business, subscriptionStatus }) => (
                <Tr key={business.id}>
                  <Th scope="row" className="normal-case tracking-normal">
                    <Link href={`/admin/negocios/${business.id}`} className="link-ink text-sm">
                      {business.name}
                    </Link>
                  </Th>
                  <Td>
                    <Badge tone={PLAN_TONE[business.plan]}>{planName(business.plan)}</Badge>
                  </Td>
                  <Td>
                    {subscriptionStatus ? (
                      <Badge tone={subscriptionStatusTone(subscriptionStatus)}>
                        {subscriptionStatusLabel(subscriptionStatus)}
                      </Badge>
                    ) : (
                      <span className="t-small text-muted-foreground">Ninguna</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      )}

      {/* ══ Contenido y pedidos ════════════════════════════════════════════ */}
      <section aria-labelledby="contenido-pedidos">
        <SectionHeading
          id="contenido-pedidos"
          title="Catálogos, productos y pedidos"
          aside={
            <Link
              href="/admin/pedidos"
              className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
            >
              Ver pedidos <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <StatTiles
          items={[
            {
              label: "Catálogos",
              value: formatCount(catalogs.total),
              hint: `${formatCount(catalogs.published)} publicados`,
            },
            {
              label: "Productos",
              value: formatCount(products.total),
              hint: `${formatCount(products.active)} visibles`,
            },
            {
              label: "Pedidos",
              value: formatCount(orders.total),
              hint: `${formatCount(orders.month)} este mes`,
              href: "/admin/pedidos",
            },
            {
              label: "Por atender",
              value: formatCount(orders.pending),
              hint: "En estado pendiente",
              tone: orders.pending > 0 ? "accent" : "muted",
              href: "/admin/pedidos",
            },
          ]}
        />
        <div className="grid-ruled mt-5 grid sm:grid-cols-2">
          <div className="p-4">
            <p className="t-label text-muted-foreground">Valor de los pedidos del mes</p>
            <p className="t-price mt-2 text-xl">{formatMoneyByCurrency(orders.monthValue)}</p>
            <p className="t-small mt-1.5 text-muted-foreground">
              Desde el {formatDate(data.monthStart)} (UTC). Excluye cancelados.
            </p>
          </div>
          <div className="p-4">
            <p className="t-label text-muted-foreground">Valor acumulado</p>
            <p className="t-price mt-2 text-xl">{formatMoneyByCurrency(orders.readValue)}</p>
            <p className="t-small mt-1.5 text-muted-foreground">
              Suma de los pedidos leídos, sin cancelados. Es lo que piden los compradores a los
              mayoristas, no ingresos de Catalii.
            </p>
          </div>
        </div>
        <SourceNote className="mt-3">
          Los totales y el recuento del mes son exactos (<code className="t-num">count</code> en el
          servidor). Los importes se suman sobre las filas leídas y se separan por moneda: nunca se
          mezclan USD y COP en una sola cifra.
        </SourceNote>
      </section>

      {/* ══ Visitas y clics ════════════════════════════════════════════════ */}
      <section aria-labelledby="metricas">
        <SectionHeading
          id="metricas"
          title="Visitas y clics"
          description={`Últimos ${METRIC_DAYS} días (fechas UTC).`}
          aside={
            <Link
              href="/admin/metricas"
              className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
            >
              Ver detalle <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        {metrics.available ? (
          <>
            <MetricChart days={metrics.daily} />
            <SourceNote className="mt-4">
              Son <strong className="font-medium text-foreground">eventos sueltos</strong>
              {" "}guardados en MongoDB y servidos por el backend: no hay visitantes únicos, ni
              sesiones, porque no se guarda nada que identifique a quien visita. Una misma persona
              que abre el catálogo cinco veces cuenta cinco visitas.
            </SourceNote>
          </>
        ) : (
          <MetricsUnavailable problem={metrics.problem} />
        )}
      </section>
    </div>
  );
}
