"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, ShoppingCart, Search, ChevronDown, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { OrderStatusSelect } from "./order-status-select";
import { formatMoney, cn } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types/database";

export type OrderWithItems = Order & { order_item: OrderItem[] };

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

type Filter = "all" | OrderStatus;
const FILTERS: Filter[] = ["all", "pending", "confirmed", "shipped", "cancelled"];
const PAGE_SIZE = 25;

export function OrdersClient({ orders }: { orders: OrderWithItems[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  /** Vuelve a la primera tanda al cambiar filtros (en el handler, no en efecto). */
  function applyFilter(fn: () => void) {
    fn();
    setShown(PAGE_SIZE);
  }

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      base[o.status] += 1;
    });
    return base;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_whatsapp.toLowerCase().includes(q) ||
        o.id.toLowerCase().startsWith(q) ||
        (o.customer_email ?? "").toLowerCase().includes(q) ||
        o.order_item.some((it) => it.product_name.toLowerCase().includes(q))
      );
    });
  }, [orders, filter, query]);

  if (orders.length === 0) {
    return (
      <div className="rule-t rule-b flex flex-col items-center gap-4 py-14 text-center">
        <ShoppingCart className="size-8 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="t-h3">Todavía no recibes pedidos</p>
          <p className="t-small mt-1 max-w-sm text-muted-foreground">
            Publica un catálogo y compártelo por WhatsApp: los pedidos llegan aquí
            automáticamente.
          </p>
        </div>
        <Link href="/dashboard/catalogos">
          <Button>Ir a mis catálogos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Filtros por estado: pestañas subrayadas, no píldoras de color ── */}
      <div
        className="-mx-1 flex gap-1 overflow-x-auto rule-b px-1"
        role="tablist"
        aria-label="Filtrar pedidos por estado"
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => applyFilter(() => setFilter(f))}
              className={cn(
                "t-label flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "Todos" : STATUS_LABEL[f]}
              <span className="t-num text-[0.6875rem] opacity-60">{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Búsqueda ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar por cliente, teléfono, # o producto…"
            value={query}
            onChange={(e) => applyFilter(() => setQuery(e.target.value))}
            className="pl-9"
            aria-label="Buscar pedidos"
          />
        </div>
        <Select
          aria-label="Filtrar por estado"
          value={filter}
          onChange={(e) => applyFilter(() => setFilter(e.target.value as Filter))}
          className="sm:hidden"
        >
          {FILTERS.map((f) => (
            <option key={f} value={f}>
              {f === "all" ? "Todos los estados" : STATUS_LABEL[f]}
            </option>
          ))}
        </Select>
      </div>

      <p className="t-label text-muted-foreground" aria-live="polite">
        {filtered.length === orders.length
          ? `${orders.length} pedidos`
          : `${filtered.length} de ${orders.length}`}
      </p>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rule-t rule-b flex flex-col items-center gap-3 py-14 text-center">
          <Search className="size-7 text-muted-foreground" aria-hidden="true" />
          <p className="t-small text-muted-foreground">
            Ningún pedido coincide con la búsqueda.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              applyFilter(() => {
                setQuery("");
                setFilter("all");
              })
            }
            className="gap-2"
          >
            <X className="size-4" aria-hidden="true" /> Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.slice(0, shown).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>

          {shown < filtered.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Mostrar más ({filtered.length - shown} restantes)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Pedido
 * Maquetado como un albarán: cabecera con folio y fecha, cuerpo de renglones
 * con cantidades e importes en columna, y pie con el total.
 * ────────────────────────────────────────────────────────────────────────── */

function OrderCard({ order: o }: { order: OrderWithItems }) {
  // Los pedidos largos se colapsan: con veinte renglones la lista deja de ser
  // escaneable. Se muestran tres y el resto bajo demanda.
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const phone = o.customer_whatsapp.replace(/[^0-9]/g, "");
  const items = expanded ? o.order_item : o.order_item.slice(0, 3);
  const hiddenCount = o.order_item.length - items.length;

  const waText = encodeURIComponent(
    `Hola ${o.customer_name}, recibimos tu pedido #${o.id.slice(0, 8)}:\n` +
      o.order_item.map((it) => `• ${it.quantity}x ${it.product_name}`).join("\n") +
      `\n\nTotal: ${formatMoney(o.total_cents, o.currency)}`,
  );

  async function copySummary() {
    const text =
      `Pedido #${o.id.slice(0, 8)} — ${o.customer_name} (${o.customer_whatsapp})\n` +
      o.order_item
        .map(
          (it) =>
            `${it.quantity}x ${it.product_name} — ${formatMoney(it.subtotal_cents, o.currency)}`,
        )
        .join("\n") +
      `\nTotal: ${formatMoney(o.total_cents, o.currency)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Pedido copiado al portapapeles.", { tone: "success", duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("No se pudo copiar.", { tone: "error" });
    }
  }

  return (
    <article
      className={cn(
        "border border-border bg-card",
        o.status === "cancelled" && "opacity-65",
      )}
    >
      {/* Cabecera del albarán */}
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 rule-b p-4">
        <div className="min-w-0">
          <p className="t-label text-muted-foreground">
            Folio {o.id.slice(0, 8)} ·{" "}
            {new Date(o.created_at).toLocaleString("es-MX", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="t-h3 mt-1.5 truncate">{o.customer_name}</p>
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-ink mt-1 inline-flex items-center gap-1.5 text-[0.8125rem] text-primary"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" /> {o.customer_whatsapp}
          </a>
          {o.customer_email && (
            <p className="t-small truncate text-muted-foreground">{o.customer_email}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="t-price text-xl">{formatMoney(o.total_cents, o.currency)}</span>
          <OrderStatusSelect id={o.id} status={o.status} />
        </div>
      </header>

      {/* Renglones */}
      <ul className="px-4 py-3">
        {items.map((it) => (
          <li key={it.id} className="flex items-baseline gap-3 py-1">
            <span className="t-num w-10 shrink-0 text-right text-[0.8125rem] text-muted-foreground">
              {it.quantity}×
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.8125rem]">{it.product_name}</span>
            <span className="t-num shrink-0 text-[0.8125rem] text-muted-foreground">
              {formatMoney(it.subtotal_cents, o.currency)}
            </span>
          </li>
        ))}

        {hiddenCount > 0 && (
          <li className="pt-1.5">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="t-label link-ink inline-flex cursor-pointer items-center gap-1.5 text-primary"
            >
              <ChevronDown className="size-3.5" aria-hidden="true" /> {hiddenCount} más
            </button>
          </li>
        )}
      </ul>

      {o.notes && (
        <p className="mx-4 mb-3 border-l-2 border-input bg-muted px-3 py-2 text-[0.8125rem]">
          <span className="t-label block text-muted-foreground">Nota del cliente</span>
          <span className="mt-1 block">{o.notes}</span>
        </p>
      )}

      {/* Acciones */}
      <footer className="flex flex-wrap gap-2 rule-t p-3" data-print="hide">
        <a href={`https://wa.me/${phone}?text=${waText}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="primary" className="gap-2">
            <MessageCircle className="size-4" aria-hidden="true" /> Confirmar por WhatsApp
          </Button>
        </a>
        <Button size="sm" variant="outline" onClick={copySummary} className="gap-2">
          {copied ? (
            <Check className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          Copiar
        </Button>
      </footer>
    </article>
  );
}
