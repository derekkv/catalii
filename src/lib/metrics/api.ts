import "server-only";
import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/timeout";
import {
  METRIC_KINDS,
  ZERO_TOTALS,
  type BusinessMetricsResponse,
  type MetricBusinessTotals,
  type MetricCatalogTotals,
  type MetricCountryTotal,
  type MetricEventPayload,
  type MetricSeriesDay,
  type MetricTotals,
  type MetricsSummaryResponse,
} from "./types";

/**
 * Cliente del backend de métricas (MongoDB detrás de `back.catalii.com`).
 *
 * Es `server-only`: el token de sesión del administrador nunca pasa por
 * JavaScript del navegador. Hace lo mismo que `src/lib/backend.ts` (misma URL
 * base, mismo `Authorization: Bearer` con el access token de Supabase, que el
 * backend revalida contra Auth), pero no se reutiliza esa función por dos
 * razones concretas:
 *
 *  · `backendFetch()` espera la envoltura `{ data, error }` de la API de
 *    negocio, y la de métricas devuelve el objeto en la raíz
 *    (`docs/METRICAS-API.md`).
 *  · Su plazo es de 10 s, pensado para una acción con botón. Aquí el que
 *    espera es una página del panel, así que el plazo es corto y un fallo no
 *    es un error: se avisa y el resto del panel sigue.
 *
 * Nada de esto devuelve ceros cuando el backend no responde. El resultado dice
 * qué pasó y la interfaz lo muestra; un cero presentado como dato real sería
 * peor que no mostrar nada.
 */

/** Plazo de las lecturas del panel. Corto: una página no debe quedarse colgada. */
const READ_TIMEOUT_MS = 4_000;

/** Plazo del reenvío del beacon. Aún más corto: nadie espera la respuesta. */
const EVENT_TIMEOUT_MS = 2_500;

/** Plazo para leer la sesión (auth-js reintenta con esperas crecientes). */
const SESSION_TIMEOUT_MS = 3_000;

/**
 * URL base del backend.
 *
 * `METRICS_API_URL` permite apuntar las métricas al backend sin activar de
 * golpe el resto de la migración (pedidos, productos y catálogos miran
 * `BACKEND_URL`). En producción las dos valen `https://back.catalii.com`.
 */
export function metricsApiBaseUrl(): string | null {
  const raw = process.env.METRICS_API_URL ?? process.env.BACKEND_URL;
  const base = raw?.trim().replace(/\/+$/, "");
  return base ? base : null;
}

export type MetricsFailureReason = "unconfigured" | "unauthorized" | "denied" | "unavailable";

export type MetricsResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MetricsFailureReason; message: string };

function fail(reason: MetricsFailureReason, message: string): MetricsResult<never> {
  return { ok: false, reason, message };
}

// ───────────────────────────────────────────────────────────────────────────
// Lectura de la respuesta (no se confía en la forma de lo que llegue)
// ───────────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Entero no negativo; cualquier otra cosa cuenta como 0. */
function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

function text(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function totalsOf(value: unknown): MetricTotals {
  const source = isRecord(value) ? value : {};
  const out = { ...ZERO_TOTALS };
  for (const kind of METRIC_KINDS) out[kind] = count(source[kind]);
  return out;
}

/** `YYYY-MM-DD`: el panel indexa la serie por esta clave. */
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function seriesOf(value: unknown): MetricSeriesDay[] {
  if (!Array.isArray(value)) return [];
  const out: MetricSeriesDay[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const day = typeof row.day === "string" && DAY_RE.test(row.day) ? row.day : null;
    if (!day) continue;
    out.push({ day, ...totalsOf(row) });
  }
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function byBusinessOf(value: unknown): MetricBusinessTotals[] {
  if (!Array.isArray(value)) return [];
  const out: MetricBusinessTotals[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const businessId = typeof row.businessId === "string" && UUID_RE.test(row.businessId)
      ? row.businessId
      : null;
    if (!businessId) continue;
    out.push({ businessId, businessSlug: text(row.businessSlug, 80), ...totalsOf(row) });
  }
  return out;
}

function byCatalogOf(value: unknown): MetricCatalogTotals[] {
  if (!Array.isArray(value)) return [];
  const out: MetricCatalogTotals[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const catalogId =
      typeof row.catalogId === "string" && UUID_RE.test(row.catalogId) ? row.catalogId : null;
    const catalogSlug = text(row.catalogSlug, 80);
    if (!catalogId && !catalogSlug) continue;
    out.push({ catalogId, catalogSlug, ...totalsOf(row) });
  }
  return out;
}

function byCountryOf(value: unknown): MetricCountryTotal[] {
  if (!Array.isArray(value)) return [];
  const out: MetricCountryTotal[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const raw = typeof row.country === "string" ? row.country.trim().toUpperCase() : "";
    out.push({
      country: /^[A-Z]{2}$/.test(raw) ? raw : null,
      count: count(row.count),
    });
  }
  return out.sort((a, b) => b.count - a.count);
}

function daysOf(value: unknown, fallback: number): number {
  const n = count(value);
  return n > 0 ? n : fallback;
}

/**
 * Cuerpo útil de la respuesta.
 *
 * El contrato devuelve el objeto en la raíz. Se tolera también
 * `{ data: { … } }` porque es la envoltura del resto de la API del backend y
 * confundirlas sería un fallo silencioso difícil de ver.
 */
function payloadOf(json: unknown): unknown {
  if (isRecord(json) && !("totals" in json) && isRecord(json.data)) return json.data;
  return json;
}

// ───────────────────────────────────────────────────────────────────────────
// Peticiones
// ───────────────────────────────────────────────────────────────────────────

const UNCONFIGURED =
  "Métricas: falta configurar la URL del backend (BACKEND_URL o METRICS_API_URL). Desde la migración 0010 las visitas y los clics viven en MongoDB, servidos por back.catalii.com; sin esa variable el panel no tiene de dónde leerlas.";

const UNAVAILABLE =
  "Métricas: el backend no respondió a tiempo. Las visitas y los clics no se muestran (no son ceros: no se pudieron leer). El resto de las cifras de esta pantalla sale de Postgres y es correcta.";

async function accessToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      "sesión de Supabase",
    );
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * `GET` autenticado contra el backend de métricas.
 *
 * El token es el del administrador que está viendo el panel: el backend lo
 * revalida contra Auth y comprueba su propia lista de administradores. No hay
 * ningún secreto compartido.
 */
async function read<T>(path: string, parse: (payload: unknown) => T): Promise<MetricsResult<T>> {
  const base = metricsApiBaseUrl();
  if (!base) return fail("unconfigured", UNCONFIGURED);

  const token = await accessToken();
  if (!token) {
    return fail(
      "unauthorized",
      "Métricas: no se pudo leer tu sesión de Supabase, que es lo que autentica la lectura en el backend. Vuelve a entrar y recarga.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
  } catch {
    // Caído, DNS, TLS o plazo agotado.
    return fail("unavailable", UNAVAILABLE);
  }

  if (res.status === 401 || res.status === 403) {
    return fail(
      "denied",
      `Métricas: el backend rechazó la lectura (${res.status}). Comprueba que tu correo está en la variable ADMIN_EMAILS del backend, que es una lista aparte de la del front.`,
    );
  }
  if (!res.ok) {
    return fail(
      "unavailable",
      `Métricas: el backend respondió ${res.status}. No se muestran visitas ni clics; el resto de las cifras sale de Postgres.`,
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return fail(
      "unavailable",
      "Métricas: la respuesta del backend no era JSON válido. No se muestran visitas ni clics.",
    );
  }

  const payload = payloadOf(json);
  if (!isRecord(payload)) {
    return fail(
      "unavailable",
      "Métricas: el backend devolvió algo que no encaja con el contrato de docs/METRICAS-API.md. No se muestran visitas ni clics.",
    );
  }

  return { ok: true, data: parse(payload) };
}

/** Resumen de plataforma: totales, serie, por negocio y por país. */
export async function fetchMetricsSummary(
  days: number,
): Promise<MetricsResult<MetricsSummaryResponse>> {
  return read(`/api/metrics/summary?days=${encodeURIComponent(String(days))}`, (payload) => {
    const p = payload as Record<string, unknown>;
    return {
      days: daysOf(p.days, days),
      totals: totalsOf(p.totals),
      series: seriesOf(p.series),
      byBusiness: byBusinessOf(p.byBusiness),
      byCountry: byCountryOf(p.byCountry),
    };
  });
}

/** Métricas de un negocio: totales, serie y desglose por catálogo. */
export async function fetchBusinessMetrics(
  businessId: string,
  days: number,
): Promise<MetricsResult<BusinessMetricsResponse>> {
  const path =
    `/api/metrics/business/${encodeURIComponent(businessId)}` +
    `?days=${encodeURIComponent(String(days))}`;
  return read(path, (payload) => {
    const p = payload as Record<string, unknown>;
    return {
      days: daysOf(p.days, days),
      totals: totalsOf(p.totals),
      series: seriesOf(p.series),
      byCatalog: byCatalogOf(p.byCatalog),
    };
  });
}

/**
 * Reenvía un evento al backend. **Nunca lanza y nunca devuelve nada.**
 *
 * Sin sesión y sin token: `POST /api/metrics/events` es público (el comprador
 * no tiene cuenta). Si el backend no está configurado o no responde, el evento
 * se pierde; es analítica, no un pedido.
 *
 * El país viaja como cabecera `CF-IPCountry` y no dentro del JSON, porque el
 * backend lo lee de la cabecera de la petición que recibe (así lo describe el
 * contrato) y la cabecera que puso Cloudflare muere en el Worker.
 */
export async function forwardMetricEvent(event: MetricEventPayload): Promise<void> {
  const base = metricsApiBaseUrl();
  if (!base) return;

  const { country, ...body } = event;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (country) headers["CF-IPCountry"] = country;

  try {
    await fetch(`${base}/api/metrics/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(EVENT_TIMEOUT_MS),
    });
  } catch {
    /* backend caído, DNS o plazo agotado: el evento se descarta en silencio. */
  }
}
