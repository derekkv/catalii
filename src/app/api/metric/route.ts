import { createClient } from "@/lib/supabase/server";
import type { MetricKind } from "@/types/database";

/**
 * Contador de visitas y clics (POST /api/metric).
 *
 * Lo llama `sendMetric()` con `navigator.sendBeacon`, así que:
 *
 *  · **Siempre responde 204**, incluso con datos basura o con Supabase caída.
 *    Un beacon no tiene a nadie escuchando la respuesta y un 4xx solo
 *    ensuciaría la consola del comprador.
 *  · **No devuelve nada del negocio.** Es un endpoint de escritura ciega: no
 *    confirma si el slug existe (el RPC `track_metric` ignora en silencio lo
 *    que no sea público), así que no sirve para enumerar negocios.
 *  · El incremento lo hace el RPC `track_metric` (`security definer`), que es
 *    lo único que `anon` puede tocar de `page_metric`.
 *
 * `order_sent` se rechaza a propósito: ese dato ya vive en la tabla `order` y
 * aceptarlo aquí dejaría que cualquiera inflara los "pedidos" del panel.
 */

const TRACKABLE: readonly MetricKind[] = ["business_view", "catalog_view", "whatsapp_click"];

/** Los slugs que genera `slugify()`: minúsculas, dígitos y guiones. */
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

function readSlug(value: unknown): string | null {
  return typeof value === "string" && SLUG_RE.test(value) ? value : null;
}

function noContent(): Response {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return noContent();

    const { kind, catalogSlug, businessSlug } = body as Record<string, unknown>;
    if (typeof kind !== "string" || !TRACKABLE.includes(kind as MetricKind)) return noContent();

    const catalog = readSlug(catalogSlug);
    const business = readSlug(businessSlug);
    // Sin destino no hay nada que contar; el RPC necesita uno de los dos.
    if (!catalog && !business) return noContent();

    const supabase = await createClient();
    await supabase.rpc("track_metric", {
      p_kind: kind,
      p_catalog_slug: catalog,
      p_business_slug: business,
    });
  } catch {
    /* JSON inválido, RPC sin aplicar todavía, red caída: se descarta. */
  }
  return noContent();
}
