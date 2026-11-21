/**
 * Modelo de la analítica. Refleja docs/METRICAS-API.md: el panel de
 * administración consume estas formas tal cual, así que cambiarlas es cambiar
 * el contrato.
 */

/**
 * Tipos de evento que se aceptan.
 *
 * `order_sent` NO está: ese dato ya vive en la tabla `order` de Supabase y
 * aceptarlo aquí dejaría que cualquiera inflara los pedidos del panel.
 */
export const METRIC_KINDS = ["business_view", "catalog_view", "whatsapp_click"] as const;

export type MetricKind = (typeof METRIC_KINDS)[number];

export type MetricDevice = "mobile" | "desktop";

/**
 * Un documento por evento en la colección `events`.
 *
 * Sin IP, sin user agent completo, sin identificador de visitante y sin
 * cookies: no permite reconstruir el comportamiento de una persona. La
 * contrapartida es que no hay visitantes únicos, solo visitas.
 */
export interface MetricEventDoc {
  kind: MetricKind;
  businessId: string;
  businessSlug: string | null;
  catalogId: string | null;
  catalogSlug: string | null;
  /** Momento del evento, en UTC. Lleva el índice TTL. */
  at: Date;
  /** Cabecera `CF-IPCountry` (ISO-3166 alfa-2). */
  country: string | null;
  /** Solo el host del referrer, nunca la URL completa. */
  referrerHost: string | null;
  device: MetricDevice | null;
}

/** Totales por tipo de evento. Siempre trae las tres claves, aunque sean 0. */
export type MetricTotals = Record<MetricKind, number>;

/** Un día de la serie, en UTC (`YYYY-MM-DD`). */
export interface MetricDayRow extends MetricTotals {
  day: string;
}

export interface MetricBusinessRow extends MetricTotals {
  businessId: string;
  businessSlug: string | null;
}

export interface MetricCatalogRow extends MetricTotals {
  /** `null` = eventos de la página del negocio, que no tienen catálogo. */
  catalogId: string | null;
  catalogSlug: string | null;
}

export interface MetricCountryRow {
  country: string;
  count: number;
}

/** Respuesta de `GET /api/metrics/summary`. */
export interface MetricsSummary {
  days: number;
  totals: MetricTotals;
  series: MetricDayRow[];
  byBusiness: MetricBusinessRow[];
  byCountry: MetricCountryRow[];
}

/** Respuesta de `GET /api/metrics/business/:businessId`. */
export interface BusinessMetrics {
  days: number;
  businessId: string;
  totals: MetricTotals;
  series: MetricDayRow[];
  byCatalog: MetricCatalogRow[];
}
