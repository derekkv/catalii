"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  ShoppingCart,
  Search,
  ChevronDown,
  Copy,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <ShoppingCart className="size-10 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-semibold">Todavía no recibes pedidos</p>
            <p className="text-sm text-muted-foreground">
              Publica un catálogo y compártelo por WhatsApp: los pedidos llegan aquí
              automáticamente.
            </p>
          </div>
          <Link href="/dashboard/catalogos">
            <Button>Ir a mis catálogos</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filtros por estado ────────────────────────────────────────────── */}
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
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
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {f === "all" ? "Todos" : STATUS_LABEL[f]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs font-bold tabular-nums",
                  active ? "bg-black/15" : "bg-muted",
                )}
              >
                {counts[f]}
              </span>
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

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length === orders.length
          ? `${orders.length} pedidos`
          : `${filtered.length} de ${orders.length} pedidos`}
      </p>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Search className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Ningún pedido coincide con la búsqueda.</p>
            <Button
              variant="outline"
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
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
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

/* ────────────────────────────────────────────────────────────────────────── */

function OrderCard({ order: o }: { order: OrderWithItems }) {
  // Los pedidos largos se colapsan: con 20 líneas por pedido la lista se vuelve
  // imposible de escanear. Se muestran 3 y el resto bajo demanda.
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const phone = o.customer_whatsapp.replace(/[^0-9]/g, "");
  const items = expanded ? o.order_item : o.order_item.slice(0, 3);
  const hiddenCount = o.order_item.length - items.length;

  // Mensaje listo para confirmar el pedido por WhatsApp en un toque.
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
    <Card className={cn(o.status === "cancelled" && "opacity-70")}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading font-bold">{o.customer_name}</p>
            <p className="text-xs text-muted-foreground">
              #{o.id.slice(0, 8)} ·{" "}
              {new Date(o.created_at).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> {o.customer_whatsapp}
            </a>
            {o.customer_email && (
              <p className="truncate text-xs text-muted-foreground">{o.customer_email}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="font-heading text-lg font-bold">
              {formatMoney(o.total_cents, o.currency)}
            </span>
            <OrderStatusSelect id={o.id} status={o.status} />
          </div>
        </div>

        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between gap-2">
              <span className="truncate text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{it.quantity}×</span>{" "}
                {it.product_name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatMoney(it.subtotal_cents, o.currency)}
              </span>
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <ChevronDown className="size-4" aria-hidden="true" /> Ver {hiddenCount} producto
            {hiddenCount === 1 ? "" : "s"} más
          </button>
        )}

        {o.notes && (
          <p className="mt-3 rounded-[var(--radius-theme-sm)] bg-muted p-3 text-sm">
            <span className="font-semibold">Nota del cliente: </span>
            {o.notes}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <a href={`https://wa.me/${phone}?text=${waText}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="accent" className="gap-2">
              <MessageCircle className="size-4" aria-hidden="true" /> Confirmar por WhatsApp
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={copySummary} className="gap-2">
            {copied ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            Copiar pedido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
