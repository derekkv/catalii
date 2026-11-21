import type { Request, Response } from "express";
import { metricsService } from "@/services/metrics.service.js";
import { resolveMetricTarget } from "@/services/metrics-target.service.js";
import {
  businessIdParamSchema,
  metricsQuerySchema,
  trackEventSchema,
  type TrackEventInput,
} from "@/schemas/metrics.schema.js";
import type { MetricDevice } from "@/types/metrics.js";

/**
 * Métricas: un endpoint de escritura (público, ciego) y dos de lectura.
 *
 * Lo que NO se guarda del visitante, y por qué: la IP y el user agent completo
 * son datos personales y no hacen falta para contar visitas. Del user agent
 * solo se deduce `mobile`/`desktop`; del referrer solo el host (una URL
 * completa puede llevar términos de búsqueda o identificadores en la query).
 */

/** Host plausible: letras, dígitos, puntos y guiones. No valida que exista. */
const HOST_RE = /^[a-z0-9][a-z0-9.-]{0,252}$/;

/** `XX` (desconocido) y `T1` (Tor) los manda Cloudflare cuando no hay país. */
const COUNTRY_RE = /^[A-Z]{2}$/;
const COUNTRY_UNKNOWN = new Set(["XX", "T1"]);

/** Señal de móvil en el user agent. Lo único que se mira del UA. */
const MOBILE_UA_RE = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i;

function header(req: Request, name: string): string | null {
  const value = req.headers[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

/** País de la cabecera de Cloudflare, o `null`. */
function country(req: Request): string | null {
  const raw = header(req, "cf-ipcountry")?.trim().toUpperCase();
  if (!raw || !COUNTRY_RE.test(raw) || COUNTRY_UNKNOWN.has(raw)) return null;
  return raw;
}

/**
 * Reduce a host. Acepta tanto `instagram.com` como una URL completa, porque el
 * cliente puede mandar cualquiera de las dos y de aquí no debe salir nunca una
 * ruta ni una query.
 */
function toHost(value: string | null | undefined): string | null {
  const raw = value?.trim().toLowerCase();
  if (!raw) return null;

  let candidate = raw;
  if (raw.includes("/") || raw.includes("://")) {
    try {
      candidate = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
    } catch {
      return null;
    }
  }
  // Fuera el puerto y el posible usuario de la autoridad.
  candidate = candidate.split("@").pop() ?? candidate;
  candidate = candidate.split(":")[0] ?? candidate;

  return HOST_RE.test(candidate) ? candidate : null;
}

/** Lo que el cliente diga, y si no dice nada se deduce del user agent. */
function device(input: TrackEventInput, req: Request): MetricDevice | null {
  if (input.device) return input.device;
  const ua = header(req, "user-agent");
  if (!ua) return null;
  return MOBILE_UA_RE.test(ua) ? "mobile" : "desktop";
}

/** Resuelve el destino y escribe. Se llama tras responder, así que no lanza. */
async function ingest(input: TrackEventInput, signals: {
  country: string | null;
  referrerHost: string | null;
  device: MetricDevice | null;
}): Promise<void> {
  const target = await resolveMetricTarget(input);
  if (!target) return; // no existe o no es público: se descarta

  await metricsService.record({
    kind: input.kind,
    businessId: target.businessId,
    businessSlug: target.businessSlug,
    catalogId: target.catalogId,
    catalogSlug: target.catalogSlug,
    at: new Date(),
    country: signals.country,
    referrerHost: signals.referrerHost,
    device: signals.device,
  });
}

export const metricsController = {
  /**
   * Beacon público. **Responde 204 siempre**: con datos inválidos, con un slug
   * que no existe o con Mongo caído. Nadie escucha la respuesta (va por
   * `navigator.sendBeacon` a través del Worker) y un 4xx solo ensuciaría la
   * consola del comprador.
   *
   * Se responde ANTES de tocar Supabase y Mongo, y el resto sigue en segundo
   * plano: así una métrica nunca retrasa la navegación de quien está comprando.
   */
  track(req: Request, res: Response): void {
    res.set("Cache-Control", "no-store").status(204).end();

    const parsed = trackEventSchema.safeParse(req.body);
    if (!parsed.success) return;

    const signals = {
      country: country(req),
      referrerHost: toHost(parsed.data.referrerHost ?? header(req, "referer")),
      device: device(parsed.data, req),
    };

    // Deliberadamente sin `await`: la respuesta ya salió. Cualquier fallo se
    // queda aquí; el evento perdido no es un incidente.
    void ingest(parsed.data, signals).catch(() => undefined);
  },

  /** Resumen global. Solo administradores (requireAdmin en el router). */
  async summary(req: Request, res: Response): Promise<void> {
    const { days } = metricsQuerySchema.parse(req.query);
    res.json({ data: await metricsService.summary(days) });
  },

  /** Resumen de un negocio. Administrador o dueño (ver requireAdminOrOwner). */
  async business(req: Request, res: Response): Promise<void> {
    const { businessId } = businessIdParamSchema.parse(req.params);
    const { days } = metricsQuerySchema.parse(req.query);
    res.json({ data: await metricsService.forBusiness(businessId, days) });
  },
};
