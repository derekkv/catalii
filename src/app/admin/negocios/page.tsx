import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { loadBusinessList, type BusinessStats } from "@/lib/admin-stats";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { DataNotes, DataTable, EmptyState, SourceNote, Td, Th, Tr } from "../_components/ui";
import {
  formatCount,
  formatDate,
  formatMaybeBool,
  formatMoneyByCurrency,
  planName,
  PLAN_TONE,
} from "../_components/format";

export const metadata: Metadata = { title: "Negocios", robots: { index: false } };

/**
 * Listado de negocios.
 *
 * El buscador y el orden viajan en la URL (`?q=&orden=`) y se resuelven en el
 * servidor: así la vista es enlazable, funciona sin JavaScript y —lo que
 * importa aquí— no hace falta mandar el listado entero a un componente de
 * cliente. Lo único que llega al navegador es el HTML ya renderizado.
 */

const SORTS = {
  recientes: "Alta: más recientes",
  antiguos: "Alta: más antiguos",
  nombre: "Nombre (A-Z)",
  pedidos: "Más pedidos",
  productos: "Más productos",
  visitas: "Más visitas (30 días)",
  plan: "Plan (de pago primero)",
} as const;

type SortKey = keyof typeof SORTS;

const PLAN_WEIGHT = { business: 3, pro: 2, starter: 1, free: 0 } as const;

function comparator(sort: SortKey): (a: BusinessStats, b: BusinessStats) => number {
  switch (sort) {
    case "antiguos":
      return (a, b) => a.business.created_at.localeCompare(b.business.created_at);
    case "nombre":
      return (a, b) => a.business.name.localeCompare(b.business.name, "es");
    case "pedidos":
      return (a, b) => b.orders - a.orders || b.business.created_at.localeCompare(a.business.created_at);
    case "productos":
      return (a, b) => b.products - a.products;
    case "visitas":
      // `null` = métricas no disponibles; esas filas se van al final en vez de
      // competir como si tuvieran cero visitas.
      return (a, b) => (b.views ?? -1) - (a.views ?? -1);
    case "plan":
      return (a, b) =>
        PLAN_WEIGHT[b.business.plan] - PLAN_WEIGHT[a.business.plan] ||
        a.business.name.localeCompare(b.business.name, "es");
    case "recientes":
    default:
      return (a, b) => b.business.created_at.localeCompare(a.business.created_at);
  }
}

/** El parámetro de la URL es de quien lo escriba: solo se aceptan claves conocidas. */
function parseSort(value: string | string[] | undefined): SortKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw in SORTS ? (raw as SortKey) : "recientes";
}

function parseQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : (value ?? "");
  return raw.slice(0, 120).trim();
}

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; orden?: string | string[] }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const query = parseQuery(params.q);
  const sort = parseSort(params.orden);

  const { rows, notes } = await loadBusinessList();

  const needle = query.toLowerCase();
  const filtered = needle
    ? rows.filter(
        (r) =>
          r.business.name.toLowerCase().includes(needle) ||
          r.business.slug.toLowerCase().includes(needle) ||
          (r.ownerEmail ?? "").toLowerCase().includes(needle) ||
          (r.business.email ?? "").toLowerCase().includes(needle),
      )
    : rows;

  const visible = [...filtered].sort(comparator(sort));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Interno · solo lectura"
        title="Negocios"
        description="Un negocio por fila, con sus catálogos, productos, pedidos y visitas. Las fechas están en UTC."
      />

      <DataNotes notes={notes} />

      {/* ── Buscador y orden (GET, sin JavaScript) ── */}
      <form method="get" className="flex flex-wrap items-end gap-3 rule-b pb-5">
        <div className="min-w-56 flex-1">
          <Label htmlFor="q">Buscar por nombre o correo</Label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Distribuidora, correo@dominio.com…"
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="orden">Ordenar por</Label>
          <Select id="orden" name="orden" defaultValue={sort}>
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline" className="shrink-0">
          <Search className="size-4" aria-hidden="true" /> Aplicar
        </Button>
        {query && (
          <Link href="/admin/negocios" className="t-label link-ink h-11 leading-[2.75rem] text-primary">
            Quitar filtro
          </Link>
        )}
      </form>

      <p className="t-small text-muted-foreground" role="status">
        {formatCount(visible.length)} de {formatCount(rows.length)} negocios
        {query && <> coinciden con «{query}»</>}.
      </p>

      {visible.length === 0 ? (
        <EmptyState>
          {rows.length === 0
            ? "Todavía no hay negocios registrados."
            : "Ningún negocio coincide con la búsqueda."}
        </EmptyState>
      ) : (
        <DataTable
          caption="Negocios de la plataforma. Cifras reales: catálogos, productos y pedidos se cuentan sobre sus tablas de Postgres; las visitas y los clics son los eventos de los últimos 30 días que devuelve el backend de métricas (MongoDB)."
          minWidth="68rem"
        >
          <thead>
            <tr>
              <Th>Negocio</Th>
              <Th>Dueño</Th>
              <Th>Plan</Th>
              <Th numeric>Catálogos</Th>
              <Th numeric>Productos</Th>
              <Th numeric>Pedidos</Th>
              <Th numeric>Visitas (30 d)</Th>
              <Th numeric>Valor pedidos</Th>
              <Th>Alta (UTC)</Th>
              <Th>Página</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const b = row.business;
              return (
                <Tr key={b.id}>
                  <Th scope="row" className="normal-case tracking-normal">
                    <Link href={`/admin/negocios/${b.id}`} className="link-ink text-sm font-medium">
                      {b.name}
                    </Link>
                    <span className="mt-1 flex items-center gap-1.5">
                      <Link
                        href={`/n/${b.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-label link-ink font-normal text-muted-foreground"
                      >
                        /n/{b.slug}
                      </Link>
                      <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Th>
                  <Td className="t-small">{row.ownerEmail ?? "—"}</Td>
                  <Td>
                    <Badge tone={PLAN_TONE[b.plan]}>{planName(b.plan)}</Badge>
                  </Td>
                  <Td numeric>
                    {formatCount(row.catalogs)}
                    <span className="t-small block text-muted-foreground">
                      {formatCount(row.publishedCatalogs)} públ.
                    </span>
                  </Td>
                  <Td numeric>{formatCount(row.products)}</Td>
                  <Td numeric>
                    {formatCount(row.orders)}
                    {row.pendingOrders > 0 && (
                      <span className="t-small block text-accent">
                        {formatCount(row.pendingOrders)} pend.
                      </span>
                    )}
                  </Td>
                  <Td numeric>
                    {row.views === null ? (
                      <span className="t-small text-muted-foreground">Sin datos</span>
                    ) : (
                      <>
                        {formatCount(row.views)}
                        {row.whatsappClicks !== null && row.whatsappClicks > 0 && (
                          <span className="t-small block text-muted-foreground">
                            {formatCount(row.whatsappClicks)} clics
                          </span>
                        )}
                      </>
                    )}
                  </Td>
                  <Td numeric className="t-price">
                    {formatMoneyByCurrency(row.orderValue)}
                  </Td>
                  <Td className="t-small whitespace-nowrap">{formatDate(b.created_at)}</Td>
                  <Td>
                    <Badge tone={b.is_public ? "success" : "muted"}>
                      {formatMaybeBool(b.is_public, "Pública", "Privada")}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <SourceNote>
        «Dueño» es el correo de la cuenta de Supabase Auth con la que entra esa persona; si Auth no
        responde se muestra el correo de contacto del negocio. «Página» es la columna{" "}
        <code className="t-num">business.is_public</code> de la migración 0009: mientras no esté
        aplicada aparece «Desconocido». Los enlaces <code className="t-num">/n/…</code> solo
        funcionan si la página está publicada. «Visitas (30 d)» son eventos de MongoDB, no
        visitantes únicos; cuando dice «Sin datos» es que el backend de métricas no respondió (lo
        verás también en los avisos de arriba), no que nadie haya visitado.
      </SourceNote>
    </div>
  );
}
