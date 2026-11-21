/**
 * Tipos de la analítica (eventos en MongoDB, servidos por el backend Express).
 *
 * No viven en `src/types/database.ts` a propósito: ese archivo describe el
 * esquema de Supabase y desde la migración `0010` las métricas ya no están
 * ahí. El contrato de la API es `docs/METRICAS-API.md`.
 *
 * Este módulo es neutral (no es `server-only`): lo usan el navegador para
 * validar el `kind` antes de mandar el beacon, el route handler que reenvía el
 * evento y el panel para pintar las cifras.
 */

/**
 * Eventos que se registran.
 *
 * `order_sent` **no está en la lista** y no es un olvido: ese dato ya vive en
 * la tabla `order` de Postgres. Si se aceptara aquí, cualquiera podría inflar
 * los «pedidos» del panel llamando al contador en bucle, y habría dos cifras
 * que se contradicen. El backend lo rechaza igual (ver el contrato).
 */
export const METRIC_KINDS = ["business_view", "catalog_view", "whatsapp_click"] as const;

export type MetricKind = (typeof METRIC_KINDS)[number];

export function isMetricKind(value: unknown): value is MetricKind {
  return typeof value === "string" && (METRIC_KINDS as readonly string[]).includes(value);
}

/** Dispositivo deducido en el servidor; `null` si no se puede saber. */
export type MetricDevice = "mobile" | "desktop";

/** Cuerpo que el Worker manda a `POST /api/metrics/events`. */
export interface MetricEventPayload {
  kind: MetricKind;
  /** Slug del catálogo visitado, si el evento es de catálogo. */
  catalogSlug: string | null;
  /** Slug del negocio, si el evento es de la página del negocio. */
  businessSlug: string | null;
  /**
   * Código ISO de dos letras de `CF-IPCountry`.
   *
   * No va en el JSON: se reenvía como la cabecera `CF-IPCountry`, que es de
   * donde lo lee el backend (ver el contrato y `forwardMetricEvent()`).
   */
  country: string | null;
  /** Solo el host del referrer, nunca la URL completa. */
  referrerHost: string | null;
  device: MetricDevice | null;
}

/** Un contador por tipo de evento. */
export type MetricTotals = Record<MetricKind, number>;

export const ZERO_TOTALS: MetricTotals = {
  business_view: 0,
  catalog_view: 0,
  whatsapp_click: 0,
};

/** Un día de la serie. La fecha es UTC (`YYYY-MM-DD`). */
export interface MetricSeriesDay extends MetricTotals {
  day: string;
}

export interface MetricBusinessTotals extends MetricTotals {
  businessId: string;
  businessSlug: string | null;
}

export interface MetricCatalogTotals extends MetricTotals {
  catalogId: string | null;
  catalogSlug: string | null;
}

export interface MetricCountryTotal {
  /** ISO de dos letras, o `null` cuando el evento llegó sin país. */
  country: string | null;
  count: number;
}

/** Respuesta de `GET /api/metrics/summary?days=N`. */
export interface MetricsSummaryResponse {
  days: number;
  totals: MetricTotals;
  series: MetricSeriesDay[];
  byBusiness: MetricBusinessTotals[];
  byCountry: MetricCountryTotal[];
}

/** Respuesta de `GET /api/metrics/business/:businessId?days=N`. */
export interface BusinessMetricsResponse {
  days: number;
  totals: MetricTotals;
  series: MetricSeriesDay[];
  byCatalog: MetricCatalogTotals[];
}
