import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { loadBusinessDetail, METRIC_DAYS } from "@/lib/admin-stats";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import {
  DataNotes,
  DataTable,
  EmptyState,
  Field,
  SectionHeading,
  SourceNote,
  Td,
  Th,
  Tr,
} from "../../_components/ui";
import { MetricChart } from "../../_components/metric-chart";
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatMaybeBool,
  formatMaybeText,
  formatMoneyByCurrency,
  METRIC_KIND_LABEL,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  planName,
  PLAN_TONE,
  subscriptionStatusLabel,
  subscriptionStatusTone,
} from "../../_components/format";

export const metadata: Metadata = { title: "Negocio", robots: { index: false } };

/**
 * Ficha de un negocio, para dar soporte.
 *
 * Muestra el correo del dueño porque sin él no se puede atender a nadie, y
 * los identificadores de Paddle para poder buscar la suscripción en su panel.
 * No hay ninguna acción: ni editar, ni cambiar de plan, ni borrar.
 */
export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const detail = await loadBusinessDetail(id);
  if (!detail) notFound();

  const { business: b, owner, catalogs, products, orders, subscriptions, metrics } = detail;
  const published = catalogs.filter((c) => c.is_public).length;

  return (
    <div className="space-y-9">
      <div>
        <Link
          href="/admin/negocios"
          className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Todos los negocios
        </Link>
      </div>

      <PageHeader
        eyebrow="Negocio · solo lectura"
        title={b.name}
        description={
          <>
            Alta el {formatDate(b.created_at)} (UTC) · plan{" "}
            <strong className="font-medium text-foreground">{planName(b.plan)}</strong>
          </>
        }
        actions={
          <Link
            href={`/n/${b.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
          >
            /n/{b.slug} <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <DataNotes notes={detail.notes} />

      <StatTiles
        items={[
          {
            label: "Catálogos",
            value: formatCount(catalogs.length),
            hint: `${formatCount(published)} publicados`,
          },
          {
            label: "Productos",
            value: formatCount(products.total),
            hint: `${formatCount(products.active)} visibles`,
          },
          {
            label: "Pedidos",
            value: formatCount(orders.total),
            hint: `${formatCount(orders.pending)} pendientes`,
            tone: orders.pending > 0 ? "accent" : undefined,
          },
          {
            label: "Visitas (30 días)",
            value: formatCount(
              metrics.byKind.business_view + metrics.byKind.catalog_view,
            ),
            hint: metrics.available
              ? `${formatCount(metrics.byKind.whatsapp_click)} clics en WhatsApp`
              : "Sin datos: falta la migración 0009",
          },
        ]}
      />

      {/* ══ Ficha ══════════════════════════════════════════════════════════ */}
      <section aria-labelledby="ficha">
        <SectionHeading id="ficha" title="Ficha" />
        <dl className="grid-ruled grid sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4">
            <Field label="Plan">
              <Badge tone={PLAN_TONE[b.plan]}>{planName(b.plan)}</Badge>
            </Field>
          </div>
          <div className="p-4">
            <Field label="Dueño (cuenta)">{owner?.email ?? "No disponible"}</Field>
          </div>
          <div className="p-4">
            <Field label="Último acceso">{formatDateTime(owner?.lastSignInAt)}</Field>
          </div>
          <div className="p-4">
            <Field label="Correo de contacto">{formatMaybeText(b.email)}</Field>
          </div>
          <div className="p-4">
            <Field label="WhatsApp">{formatMaybeText(b.whatsapp)}</Field>
          </div>
          <div className="p-4">
            <Field label="Rubro">{formatMaybeText(b.category)}</Field>
          </div>
          <div className="p-4">
            <Field label="Ubicación">
              {[b.city, b.country].filter(Boolean).join(", ") || formatMaybeText(b.city)}
            </Field>
          </div>
          <div className="p-4">
            <Field label="Página pública">
              <Badge tone={b.is_public ? "success" : "muted"}>
                {formatMaybeBool(b.is_public, "Publicada", "Despublicada")}
              </Badge>
            </Field>
          </div>
          <div className="p-4">
            <Field label="Lista productos en su página">
              {formatMaybeBool(b.show_products, "Sí", "No")}
            </Field>
          </div>
          <div className="p-4">
            <Field label="Theme">{b.theme}</Field>
          </div>
          <div className="p-4">
            <Field label="Identificador" mono>
              {b.id}
            </Field>
          </div>
          <div className="p-4">
            <Field label="Cuenta (owner_id)" mono>
              {b.owner_id}
            </Field>
          </div>
          <div className="p-4">
            <Field label="Última modificación">{formatDateTime(b.updated_at)}</Field>
          </div>
        </dl>
      </section>

      {/* ══ Suscripciones ══════════════════════════════════════════════════ */}
      <section aria-labelledby="suscripcion">
        <SectionHeading
          id="suscripcion"
          title="Suscripción"
          description="Lo que dejó registrado el último webhook de Paddle."
        />
        {subscriptions.length === 0 ? (
          <EmptyState>
            Este negocio no tiene ninguna suscripción registrada en{" "}
            <code className="t-num">paddle_subscription</code>.
          </EmptyState>
        ) : (
          <DataTable
            caption="Suscripciones de Paddle de este negocio. Dato real: tabla paddle_subscription."
            minWidth="46rem"
          >
            <thead>
              <tr>
                <Th>Estado</Th>
                <Th>Suscripción</Th>
                <Th>Cliente</Th>
                <Th>Precio / producto</Th>
                <Th>Cambio programado (UTC)</Th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(({ subscription: s, customerEmail }) => (
                <Tr key={s.subscription_id}>
                  <Th scope="row" className="normal-case tracking-normal">
                    <Badge tone={subscriptionStatusTone(s.status)}>
                      {subscriptionStatusLabel(s.status)}
                    </Badge>
                  </Th>
                  <Td className="t-num text-[0.8125rem]">{s.subscription_id}</Td>
                  <Td className="t-small">
                    {customerEmail ?? "—"}
                    <span className="t-num mt-1 block text-[0.75rem] text-muted-foreground">
                      {s.customer_id}
                    </span>
                  </Td>
                  <Td className="t-num text-[0.75rem]">
                    {s.price_id ?? "—"}
                    <span className="mt-1 block text-muted-foreground">{s.product_id ?? "—"}</span>
                  </Td>
                  <Td className="t-small">{formatDateTime(s.scheduled_change_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* ══ Catálogos ══════════════════════════════════════════════════════ */}
      <section aria-labelledby="catalogos">
        <SectionHeading id="catalogos" title="Catálogos" />
        {catalogs.length === 0 ? (
          <EmptyState>Este negocio todavía no ha creado catálogos.</EmptyState>
        ) : (
          <DataTable
            caption="Catálogos del negocio. Dato real: tabla catalog."
            minWidth="34rem"
          >
            <thead>
              <tr>
                <Th>Catálogo</Th>
                <Th>Enlace</Th>
                <Th>Estado</Th>
                <Th>Creado (UTC)</Th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((c) => (
                <Tr key={c.id}>
                  <Th scope="row" className="normal-case tracking-normal text-sm font-medium">
                    {c.display_name || c.name}
                  </Th>
                  <Td>
                    <Link
                      href={`/c/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-label link-ink text-muted-foreground"
                    >
                      /c/{c.slug}
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone={c.is_public ? "success" : "muted"}>
                      {c.is_public ? "Público" : "Privado"}
                    </Badge>
                  </Td>
                  <Td className="t-small">{formatDate(c.created_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* ══ Productos ══════════════════════════════════════════════════════ */}
      <section aria-labelledby="productos">
        <SectionHeading
          id="productos"
          title="Productos"
          description={`${formatCount(products.total)} en total, ${formatCount(products.active)} visibles. Abajo los 12 más recientes.`}
        />
        {products.recent.length === 0 ? (
          <EmptyState>Este negocio todavía no ha cargado productos.</EmptyState>
        ) : (
          <DataTable
            caption="Los 12 productos más recientes del negocio. Dato real: tabla product."
            minWidth="38rem"
          >
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>SKU</Th>
                <Th numeric>Precio</Th>
                <Th numeric>Stock</Th>
                <Th>Visible</Th>
                <Th>Creado (UTC)</Th>
              </tr>
            </thead>
            <tbody>
              {products.recent.map((p) => (
                <Tr key={p.id}>
                  <Th scope="row" className="normal-case tracking-normal text-sm font-medium">
                    {p.name}
                  </Th>
                  <Td className="t-num text-[0.8125rem]">{p.sku ?? "—"}</Td>
                  <Td numeric className="t-price">
                    {formatMoney(p.price_cents, p.currency)}
                  </Td>
                  <Td numeric>{formatCount(p.stock)}</Td>
                  <Td>
                    <Badge tone={p.active ? "success" : "muted"}>{p.active ? "Sí" : "No"}</Badge>
                  </Td>
                  <Td className="t-small">{formatDate(p.created_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* ══ Pedidos ════════════════════════════════════════════════════════ */}
      <section aria-labelledby="pedidos">
        <SectionHeading
          id="pedidos"
          title="Pedidos"
          description={
            <>
              {formatCount(orders.total)} en total · valor sin cancelados:{" "}
              {formatMoneyByCurrency(orders.value)} (sobre los últimos 200 pedidos leídos)
            </>
          }
        />
        {orders.recent.length === 0 ? (
          <EmptyState>Este negocio todavía no ha recibido pedidos.</EmptyState>
        ) : (
          <DataTable
            caption="Los 20 pedidos más recientes del negocio. Dato real: tabla order."
            minWidth="40rem"
          >
            <thead>
              <tr>
                <Th>Fecha (UTC)</Th>
                <Th>Cliente</Th>
                <Th>Estado</Th>
                <Th numeric>Importe</Th>
              </tr>
            </thead>
            <tbody>
              {orders.recent.map((o) => (
                <Tr key={o.id}>
                  <Th scope="row" className="t-num normal-case tracking-normal text-[0.8125rem] font-normal">
                    {formatDateTime(o.created_at)}
                  </Th>
                  <Td className="t-small">
                    {o.customer_name}
                    <span className="mt-1 block text-muted-foreground">{o.customer_whatsapp}</span>
                  </Td>
                  <Td>
                    <Badge tone={ORDER_STATUS_TONE[o.status]}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </Badge>
                  </Td>
                  <Td numeric className="t-price">
                    {formatMoney(o.total_cents, o.currency)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>

      {/* ══ Métricas ═══════════════════════════════════════════════════════ */}
      <section aria-labelledby="metricas-negocio">
        <SectionHeading
          id="metricas-negocio"
          title="Visitas y clics"
          description={`Últimos ${METRIC_DAYS} días (fechas UTC).`}
        />
        {metrics.available ? (
          <>
            <dl className="grid-ruled mb-5 grid grid-cols-2 lg:grid-cols-4">
              {(
                [
                  "business_view",
                  "catalog_view",
                  "whatsapp_click",
                  "order_sent",
                ] as const
              ).map((kind) => (
                <div key={kind} className="p-4">
                  <dt className="t-label text-muted-foreground">{METRIC_KIND_LABEL[kind]}</dt>
                  <dd className="t-num mt-2 text-xl">{formatCount(metrics.byKind[kind])}</dd>
                </div>
              ))}
            </dl>
            <MetricChart days={metrics.daily} />
            <SourceNote className="mt-4">
              Contadores por día de <code className="t-num">page_metric</code>, sin visitantes
              únicos ni origen del tráfico. Los pedidos enviados se cuentan también en la tabla{" "}
              <code className="t-num">order</code>, así que las dos cifras pueden no cuadrar si
              alguien repite el envío.
            </SourceNote>
          </>
        ) : (
          <div className="border-l-2 border-warning bg-muted/60 px-4 py-3">
            <p className="t-label text-warning">Métricas todavía no disponibles</p>
            <p className="t-small mt-2 text-muted-foreground">
              Falta aplicar{" "}
              <code className="t-num">supabase/migrations/0009_business_pages_and_metrics.sql</code>.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
