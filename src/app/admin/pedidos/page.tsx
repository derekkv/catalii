import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { loadRecentOrders } from "@/lib/admin-stats";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { DataNotes, DataTable, EmptyState, SourceNote, Td, Th, Tr } from "../_components/ui";
import {
  formatCount,
  formatDateTime,
  formatMoneyByCurrency,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
} from "../_components/format";
import type { OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false } };

/** Cuántos pedidos se traen. Es un registro de actividad, no un archivo. */
const LIMIT = 150;

const STATUS_FILTERS = {
  todos: "Todos",
  pending: "Pendientes",
  confirmed: "Confirmados",
  shipped: "Enviados",
  cancelled: "Cancelados",
} as const;

type StatusFilter = keyof typeof STATUS_FILTERS;

function parseFilter(value: string | string[] | undefined): StatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw in STATUS_FILTERS ? (raw as StatusFilter) : "todos";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  await requireAdmin();

  const filter = parseFilter((await searchParams).estado);
  const { rows, total, notes } = await loadRecentOrders(LIMIT);

  const visible =
    filter === "todos" ? rows : rows.filter(({ order }) => order.status === (filter as OrderStatus));

  const pending = rows.filter(({ order }) => order.status === "pending").length;
  const value: Record<string, number> = {};
  for (const { order } of visible) {
    if (order.status === "cancelled") continue;
    value[order.currency] = (value[order.currency] ?? 0) + order.total_cents;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Interno · solo lectura"
        title="Pedidos de la plataforma"
        description={`Los ${LIMIT} pedidos más recientes de todos los negocios, del más nuevo al más antiguo. Fechas en UTC.`}
      />

      <DataNotes notes={notes} />

      <StatTiles
        items={[
          { label: "Pedidos (total)", value: formatCount(total), hint: "Histórico completo" },
          {
            label: "En esta vista",
            value: formatCount(visible.length),
            hint: `De los ${formatCount(rows.length)} más recientes`,
          },
          {
            label: "Por atender",
            value: formatCount(pending),
            hint: "Pendientes entre los recientes",
            tone: pending > 0 ? "accent" : "muted",
          },
          {
            label: "Valor en esta vista",
            value: formatMoneyByCurrency(value),
            hint: "Sin cancelados",
          },
        ]}
      />

      <form method="get" className="flex flex-wrap items-end gap-3 rule-b pb-5">
        <div>
          <Label htmlFor="estado">Filtrar por estado</Label>
          <Select id="estado" name="estado" defaultValue={filter}>
            {Object.entries(STATUS_FILTERS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline" className="shrink-0">
          <Search className="size-4" aria-hidden="true" /> Aplicar
        </Button>
      </form>

      {visible.length === 0 ? (
        <EmptyState>
          {rows.length === 0
            ? "Todavía no hay pedidos en la plataforma."
            : "Ningún pedido reciente con ese estado."}
        </EmptyState>
      ) : (
        <DataTable
          caption="Pedidos recientes de toda la plataforma. Dato real: tabla order, cruzada con business por business_id."
          minWidth="52rem"
        >
          <thead>
            <tr>
              <Th>Fecha (UTC)</Th>
              <Th>Negocio</Th>
              <Th>Cliente</Th>
              <Th>Estado</Th>
              <Th numeric>Importe</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ order: o, business }) => (
              <Tr key={o.id}>
                <Th
                  scope="row"
                  className="t-num whitespace-nowrap normal-case tracking-normal text-[0.8125rem] font-normal text-foreground"
                >
                  {formatDateTime(o.created_at)}
                </Th>
                <Td className="t-small">
                  {business ? (
                    <Link href={`/admin/negocios/${business.id}`} className="link-ink font-medium">
                      {business.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Negocio borrado</span>
                  )}
                </Td>
                <Td className="t-small">
                  {o.customer_name}
                  <span className="mt-1 block text-muted-foreground">{o.customer_whatsapp}</span>
                </Td>
                <Td>
                  <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                </Td>
                <Td numeric className="t-price">
                  {formatMoney(o.total_cents, o.currency)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <SourceNote>
        «Pedidos (total)» es exacto (se cuenta en el servidor). El resto de las cifras de esta
        pantalla se calculan sobre los {LIMIT} pedidos traídos, no sobre el histórico: el valor
        acumulado de toda la plataforma está en el resumen. Los importes vienen en centavos (
        <code className="t-num">total_cents</code>) y se formatean con la moneda de cada pedido.
      </SourceNote>
    </div>
  );
}
