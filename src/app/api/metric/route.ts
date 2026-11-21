import { after } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { forwardMetricEvent } from "@/lib/metrics/api";
import { isMetricKind, type MetricDevice, type MetricEventPayload } from "@/lib/metrics/types";

/**
 * Contador de visitas y clics (POST /api/metric).
 *
 * Lo llama `sendMetric()` con `navigator.sendBeacon`, así que:
 *
 *  · **Siempre responde 204**, incluso con datos basura o con el backend
 *    caído. Un beacon no tiene a nadie escuchando la respuesta y un 4xx solo
 *    ensuciaría la consola del comprador.
 *  · **No devuelve nada del negocio.** Es un endpoint de escritura ciega: no
 *    confirma si el slug existe (quien resuelve el slug, y solo si es público,
 *    es el backend), así que no sirve para enumerar negocios.
 *  · El evento se guarda en MongoDB a través del backend
 *    (`POST /api/metrics/events`, ver `docs/METRICAS-API.md`). Desde la
 *    migración `0010` no hay nada de métricas en Postgres.
 *
 * Se mantiene el salto por el Worker a propósito: el beacon va al mismo origen
 * (sin CORS y sin tocar `connect-src` de la CSP) y el navegador recibe su 204
 * sin esperar al backend.
 *
 * `order_sent` se rechaza a propósito: ese dato ya vive en la tabla `order` y
 * aceptarlo aquí dejaría que cualquiera inflara los "pedidos" del panel. No
 * está en `METRIC_KINDS`, así que la validación de `kind` ya lo descarta.
 *
 * Lo que añade el Worker al evento (el navegador no lo manda):
 *  · `country` de la cabecera `CF-IPCountry` que pone Cloudflare, que el
 *    cliente de métricas reenvía como cabecera al backend.
 *  · `referrerHost`: solo el host, nunca la URL completa, y nunca el propio.
 *  · `device`: `mobile` o `desktop`, deducido de las cabeceras. El user agent
 *    no se guarda ni se reenvía; solo se mira para ese booleano.
 */

/** Los slugs que genera `slugify()`: minúsculas, dígitos y guiones. */
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

function readSlug(value: unknown): string | null {
  return typeof value === "string" && SLUG_RE.test(value) ? value : null;
}

function noContent(): Response {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/** País de `CF-IPCountry`. `XX` y `T1` son «desconocido» y «Tor» para Cloudflare. */
function readCountry(request: Request): string | null {
  const raw = request.headers.get("cf-ipcountry")?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(raw) || raw === "XX" || raw === "T1") return null;
  return raw;
}

/**
 * Host del referrer.
 *
 * El `Referer` del beacon es la propia página del catálogo (es una petición al
 * mismo origen), así que no sirve para saber de dónde llegó la visita: ese
 * dato lo manda el navegador en el cuerpo (`document.referrer`). Si coincide
 * con el host de esta petición, se descarta: navegar dentro del sitio no es un
 * origen de tráfico.
 */
function readReferrerHost(request: Request, value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 2048) return null;
  let host: string;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    host = url.hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host || host.length > 253) return null;

  const own = new Set<string>();
  try {
    own.add(new URL(request.url).hostname.toLowerCase());
  } catch {
    /* URL de la petición rara: no pasa nada, queda la cabecera Host. */
  }
  const hostHeader = request.headers.get("host");
  if (hostHeader) own.add(hostHeader.split(":")[0].toLowerCase());
  if (own.has(host)) return null;

  return host;
}

/**
 * Dispositivo.
 *
 * Primero el client hint `Sec-CH-UA-Mobile`, que es lo que el navegador
 * declara; si no viene (Safari, Firefox), se mira el user agent. Solo sale de
 * aquí un `mobile` / `desktop`: ni el user agent ni la IP se guardan.
 */
function readDevice(request: Request): MetricDevice | null {
  const hint = request.headers.get("sec-ch-ua-mobile")?.trim();
  if (hint === "?1") return "mobile";
  if (hint === "?0") return "desktop";

  const ua = request.headers.get("user-agent");
  if (!ua) return null;
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile Safari|Mobi/i.test(ua)
    ? "mobile"
    : "desktop";
}

/**
 * Lanza el reenvío sin bloquear la respuesta al navegador.
 *
 * En Cloudflare Workers se hace con el `waitUntil` del contexto de ejecución,
 * que `@opennextjs/cloudflare` expone con `getCloudflareContext()`: el Worker
 * sigue vivo hasta que la promesa termina, aunque la respuesta ya se envió.
 *
 * Reservas, en orden, porque este endpoint también corre fuera de Workers
 * (`next dev`, `next start`, y cualquier prueba local):
 *  1. `after()` de Next, que ejecuta la tarea después de responder.
 *  2. Dejar la promesa suelta. Como `forwardMetricEvent()` no lanza nunca, no
 *     hay riesgo de rechazo no capturado; lo único que puede pasar es que el
 *     runtime la corte antes de terminar y se pierda el evento.
 */
function background(task: Promise<void>): void {
  try {
    const { ctx } = getCloudflareContext();
    const waitUntil = (ctx as { waitUntil?: (promise: Promise<unknown>) => void } | undefined)
      ?.waitUntil;
    if (typeof waitUntil === "function") {
      waitUntil.call(ctx, task);
      return;
    }
  } catch {
    /* Fuera de Workers no hay contexto: se usa la reserva. */
  }

  try {
    after(task);
    return;
  } catch {
    /* Sin contexto de petición de Next tampoco: última reserva. */
  }

  void task;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return noContent();

    const { kind, catalogSlug, businessSlug, referrer } = body as Record<string, unknown>;
    if (!isMetricKind(kind)) return noContent();

    const catalog = readSlug(catalogSlug);
    const business = readSlug(businessSlug);
    // Sin destino no hay nada que contar: el backend necesita uno de los dos
    // para resolver el negocio.
    if (!catalog && !business) return noContent();

    const event: MetricEventPayload = {
      kind,
      catalogSlug: catalog,
      businessSlug: business,
      country: readCountry(request),
      referrerHost: readReferrerHost(request, referrer),
      device: readDevice(request),
    };

    background(forwardMetricEvent(event));
  } catch {
    /* JSON inválido, cuerpo ilegible: se descarta sin ruido. */
  }
  return noContent();
}
