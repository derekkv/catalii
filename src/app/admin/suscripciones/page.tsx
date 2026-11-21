import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { loadSubscriptions } from "@/lib/admin-stats";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { DataNotes, DataTable, EmptyState, SourceNote, Td, Th, Tr } from "../_components/ui";
import {
  formatCount,
  formatDateTime,
  planName,
  PLAN_TONE,
  subscriptionStatusLabel,
  subscriptionStatusTone,
} from "../_components/format";

export const metadata: Metadata = { title: "Suscripciones", robots: { index: false } };

/** Estados que Paddle usa hoy. El filtro acepta solo estos o «todas». */
const STATUS_FILTERS = {
  todas: "Todas",
  active: "Activas",
  trialing: "En prueba",
  past_due: "En mora",
  paused: "Pausadas",
  canceled: "Canceladas",
  programadas: "Con cambio programado",
} as const;

type StatusFilter = keyof typeof STATUS_FILTERS;

function parseFilter(value: string | string[] | undefined): StatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw in STATUS_FILTERS ? (raw as StatusFilter) : "todas";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  await requireAdmin();

  const filter = parseFilter((await searchParams).estado);
  const { rows, notes } = await loadSubscriptions();

  const visible = rows.filter(({ subscription: s }) => {
    if (filter === "todas") return true;
    if (filter === "programadas") return Boolean(s.scheduled_change_at);
    // Paddle escribe «canceled»; se acepta también la grafía con dos eles por
    // si algún evento viejo la dejó así.
    if (filter === "canceled") return s.status === "canceled" || s.status === "cancelled";
    return s.status === filter;
  });

  const scheduled = rows.filter(({ subscription: s }) => s.scheduled_change_at).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Interno · solo lectura"
        title="Suscripciones"
        description="Estado de cobro de cada negocio según Paddle, con los identificadores para buscarlo en su panel. Fechas en UTC."
      />

      <DataNotes notes={notes} />

      <form method="get" className="flex flex-wrap items-end gap-3 rule-b pb-5">
        <div>
          <Label htmlFor="estado">Filtrar por estado</Label>
          <Select id="estado" name="estado" defaultValue={filter}>
            {Object.entries(STATUS_FILTERS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline" className="shrink-0">
          <Search className="size-4" aria-hidden="true" /> Aplicar
        </Button>
      </form>

      <p className="t-small text-muted-foreground" role="status">
        {formatCount(visible.length)} de {formatCount(rows.length)} suscripciones ·{" "}
        {formatCount(scheduled)} con cambio programado.
      </p>

      {visible.length === 0 ? (
        <EmptyState>
          {rows.length === 0
            ? "Todavía no hay suscripciones registradas. La tabla paddle_subscription se rellena con los webhooks de Paddle."
            : "Ninguna suscripción con ese estado."}
        </EmptyState>
      ) : (
        <DataTable
          caption="Suscripciones de Paddle. Dato real: tabla paddle_subscription, cruzada con business y paddle_customer por sus claves ajenas."
          minWidth="64rem"
        >
          <thead>
            <tr>
              <Th>Negocio</Th>
              <Th>Plan en la app</Th>
              <Th>Estado</Th>
              <Th>Suscripción (Paddle)</Th>
              <Th>Cliente (Paddle)</Th>
              <Th>Precio / producto</Th>
              <Th>Cambio programado (UTC)</Th>
              <Th>Actualizada (UTC)</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ subscription: s, business, customerEmail }) => (
              <Tr key={s.subscription_id}>
                <Th scope="row" className="normal-case tracking-normal">
                  {business ? (
                    <Link
                      href={`/admin/negocios/${business.id}`}
                      className="link-ink text-sm font-medium"
                    >
                      {business.name}
                    </Link>
                  ) : (
                    <span className="t-small text-muted-foreground">Sin negocio asociado</span>
                  )}
                  <span className="t-small mt-1 block font-normal text-muted-foreground">
                    {customerEmail ?? "—"}
                  </span>
                </Th>
                <Td>
                  {business ? (
                    <Badge tone={PLAN_TONE[business.plan]}>{planName(business.plan)}</Badge>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  <Badge tone={subscriptionStatusTone(s.status)}>
                    {subscriptionStatusLabel(s.status)}
                  </Badge>
                </Td>
                <Td className="t-num text-[0.75rem]">{s.subscription_id}</Td>
                <Td className="t-num text-[0.75rem]">{s.customer_id}</Td>
                <Td className="t-num text-[0.75rem]">
                  {s.price_id ?? "—"}
                  <span className="mt-1 block text-muted-foreground">{s.product_id ?? "—"}</span>
                </Td>
                <Td className="t-small whitespace-nowrap">
                  {s.scheduled_change_at ? (
                    <span className="text-warning">{formatDateTime(s.scheduled_change_at)}</span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="t-small whitespace-nowrap">{formatDateTime(s.updated_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <SourceNote>
        El estado es el del último webhook procesado, no una consulta en vivo a Paddle: si un
        evento se perdió, aquí se verá el valor anterior. «Cambio programado» es{" "}
        <code className="t-num">scheduled_change_at</code>, la fecha en la que se aplicará la
        cancelación o el cambio de plan que el cliente ya pidió. Los identificadores{" "}
        <code className="t-num">sub_…</code>, <code className="t-num">ctm_…</code>,{" "}
        <code className="t-num">pri_…</code> y <code className="t-num">pro_…</code> son referencias
        públicas de Paddle, no credenciales.
      </SourceNote>
    </div>
  );
}
