import { formatMoney } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import type { MetricKind, OrderStatus, PlanTier } from "@/types/database";

/**
 * Formato de los datos del panel de administración.
 *
 * Todas las fechas se muestran en **UTC**, no en la zona del navegador:
 * `page_metric.day` es una fecha UTC y mezclar husos haría que una visita del
 * día 1 apareciera en el 31. Para que no haya dos criterios en la misma
 * pantalla, también los `timestamptz` (altas, pedidos, cambios programados) se
 * imprimen en UTC, y cada pantalla lo dice.
 */

const DATE = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const DAY_SHORT = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/** `2026-01-12T…` → «12 ene 2026» (UTC). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE.format(d);
}

/** `2026-01-12T…` → «12 ene 2026, 14:03» (UTC). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_TIME.format(d);
}

/** `2026-01-12` (fecha UTC de `page_metric.day`) → «12 ene». */
export function formatDayShort(day: string): string {
  // `T00:00:00Z` explícito: `new Date("2026-01-12")` ya se interpreta como
  // UTC, pero dejarlo escrito evita depender de ese detalle.
  return DAY_SHORT.format(new Date(`${day}T00:00:00Z`));
}

/** Entero con separador de miles. */
export function formatCount(value: number): string {
  return value.toLocaleString("es-MX");
}

/**
 * Importes por moneda.
 *
 * No se suman monedas distintas: si hay pedidos en USD y en MXN se imprimen
 * los dos importes separados por un punto medio. Un único número sería una
 * cifra inventada.
 */
export function formatMoneyByCurrency(
  money: Record<string, number>,
  fallbackCurrency = "USD",
): string {
  const entries = Object.entries(money).filter(([, cents]) => cents !== 0);
  if (entries.length === 0) return formatMoney(0, fallbackCurrency);
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([currency, cents]) => formatMoney(cents, currency))
    .join(" · ");
}

/** Monedas presentes en un importe agrupado, para rotular la cifra. */
export function currenciesOf(money: Record<string, number>): string[] {
  return Object.keys(money).sort();
}

export type Tone = "primary" | "accent" | "muted" | "success" | "warning" | "danger" | "outline";

/** Nombre comercial del plan (de `src/lib/plans.ts`, no escrito a mano). */
export function planName(tier: PlanTier): string {
  return getPlan(tier).name;
}

export const PLAN_TONE: Record<PlanTier, Tone> = {
  free: "muted",
  starter: "primary",
  pro: "accent",
  business: "outline",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "primary",
  shipped: "success",
  cancelled: "danger",
};

/**
 * Estados de suscripción de Paddle.
 *
 * `status` es un `text` libre en la base (lo escribe el webhook con lo que
 * manda Paddle), así que la traducción tiene que tolerar valores no previstos:
 * `subscriptionStatusLabel` devuelve el valor crudo si no lo reconoce, en vez
 * de esconderlo.
 */
const SUB_STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "En prueba",
  past_due: "En mora",
  paused: "Pausada",
  canceled: "Cancelada",
  cancelled: "Cancelada",
};

const SUB_STATUS_TONE: Record<string, Tone> = {
  active: "success",
  trialing: "primary",
  past_due: "danger",
  paused: "warning",
  canceled: "muted",
  cancelled: "muted",
};

export function subscriptionStatusLabel(status: string): string {
  return SUB_STATUS_LABEL[status] ?? status;
}

export function subscriptionStatusTone(status: string): Tone {
  return SUB_STATUS_TONE[status] ?? "outline";
}

export const METRIC_KIND_LABEL: Record<MetricKind, string> = {
  business_view: "Visitas a la página del negocio",
  catalog_view: "Visitas a catálogos",
  whatsapp_click: "Clics en WhatsApp",
  order_sent: "Pedidos enviados",
};

/**
 * Texto de una columna que puede no existir todavía.
 *
 * Distingue tres casos que no son lo mismo: la columna no está en la base
 * (migración pendiente), está pero vacía, o tiene valor.
 */
export function formatMaybeText(value: string | null | undefined): string {
  if (value === undefined) return "No disponible (migración 0009)";
  if (value === null || value.trim() === "") return "—";
  return value;
}

/** Texto de una columna booleana que puede no existir todavía en la base. */
export function formatMaybeBool(
  value: boolean | null | undefined,
  yes: string,
  no: string,
): string {
  if (value === true) return yes;
  if (value === false) return no;
  return "Desconocido";
}
