import { publicClient, supabaseAdmin } from "@/lib/supabase.js";
import { TtlCache } from "@/lib/ttl-cache.js";

/**
 * Resolución de slug → ids para las métricas.
 *
 * El navegador solo conoce slugs; el evento se guarda con ids para que el panel
 * pueda agrupar aunque el dueño renombre su catálogo. De paso, la resolución es
 * el filtro de seguridad: se hace con `publicClient()` (cliente anónimo), así
 * que RLS solo deja ver catálogos y negocios **públicos**. Lo que no resuelve
 * se descarta en silencio, igual que hacía el RPC `track_metric`: el endpoint no
 * confirma si un slug existe, así que no sirve para enumerar negocios.
 *
 * Con caché en memoria porque consultar Supabase en cada visita sería absurdo:
 * una ráfaga de eventos del mismo catálogo se resuelve una vez cada 5 minutos.
 * También se cachean los fallos (TTL más corto) para que un bot golpeando
 * slugs inexistentes no se convierta en una consulta por evento.
 */

export interface MetricTarget {
  businessId: string;
  businessSlug: string | null;
  catalogId: string | null;
  catalogSlug: string | null;
}

const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 60_000;

/** `null` cacheado = ese slug no existe o no es público. */
const cache = new TtlCache<MetricTarget | null>(1_000);

/** Solo para pruebas: olvida el mapeo cacheado. */
export function clearMetricTargetCache(): void {
  cache.clear();
}

/**
 * Slug del negocio dueño del catálogo, solo para etiquetar el evento.
 *
 * Va con el cliente de servicio a propósito: la página del negocio arranca
 * despublicada (`business.is_public` por defecto `false`), así que el cliente
 * anónimo no puede leer el nombre del dueño de un catálogo público y el panel
 * se quedaría sin etiqueta en `byBusiness`. Que el catálogo sea público ya se
 * comprobó con RLS justo antes; esto no abre ninguna puerta nueva y el slug
 * nunca se devuelve al navegador (el beacon responde 204 sin cuerpo).
 */
async function businessSlugById(businessId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("business")
    .select("slug")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { slug: string }).slug;
}

async function resolveCatalog(slug: string): Promise<MetricTarget | null> {
  const { data, error } = await publicClient()
    .from("catalog")
    .select("id, slug, business_id")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as { id: string; slug: string; business_id: string };

  return {
    businessId: row.business_id,
    businessSlug: await businessSlugById(row.business_id),
    catalogId: row.id,
    catalogSlug: row.slug,
  };
}

async function resolveBusiness(slug: string): Promise<MetricTarget | null> {
  const { data, error } = await publicClient()
    .from("business")
    .select("id, slug")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as { id: string; slug: string };

  return {
    businessId: row.id,
    businessSlug: row.slug,
    catalogId: null,
    catalogSlug: null,
  };
}

/**
 * Devuelve los ids del evento, o `null` si el destino no existe o no es
 * público. Nunca lanza: un fallo de Supabase no debe romper el beacon.
 */
export async function resolveMetricTarget(target: {
  catalogSlug?: string | null;
  businessSlug?: string | null;
}): Promise<MetricTarget | null> {
  // El catálogo manda: si llega con los dos, el evento es del catálogo.
  const kind = target.catalogSlug ? "catalog" : "business";
  const slug = target.catalogSlug ?? target.businessSlug;
  if (!slug) return null;

  const key = `${kind}:${slug}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let resolved: MetricTarget | null = null;
  try {
    resolved = kind === "catalog" ? await resolveCatalog(slug) : await resolveBusiness(slug);
  } catch {
    // Supabase caída o sin red: no se cachea el fallo (puede ser temporal).
    return null;
  }

  cache.set(key, resolved, resolved ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS);
  return resolved;
}
