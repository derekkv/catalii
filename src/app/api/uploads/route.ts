import { NextResponse } from "next/server";
import { z } from "zod";
import { getBusiness, AuthUnavailableError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  KIND_SPECS,
  buildKey,
  mediaUrl,
  thumbUrl,
  thumbKeyOf,
  parseMainKey,
  type MediaKind,
} from "@/lib/media/config";
import {
  MediaConfigError,
  deleteMedia,
  putObject,
  sniffImage,
} from "@/lib/media/server";

/*
 * Subida de imágenes a R2.
 *
 * Es un Route Handler y no una Server Action a propósito: las acciones tienen
 * un límite de cuerpo de 1 MB por defecto y la imagen + miniatura lo superan.
 *
 * El navegador ya envía la imagen comprimida y su miniatura (ver
 * src/lib/media/resize.ts). Aquí se revalida todo: sesión, tipo real por
 * firma de bytes, dimensiones y peso. La clave la decide el servidor (uuid
 * bajo el id del negocio), nunca el cliente.
 */

export const dynamic = "force-dynamic";

const kindSchema = z.enum(["product", "logo", "banner"]);

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Mismo origen: estas rutas usan cookies de sesión, se bloquea CSRF entre sitios. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // navegadores siempre lo envían en POST/DELETE con fetch
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

async function requireBusinessForApi() {
  try {
    return { business: await getBusiness() };
  } catch (err) {
    if (err instanceof AuthUnavailableError) return { unavailable: true as const };
    throw err;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: "Origen no permitido." });

  const auth = await requireBusinessForApi();
  if ("unavailable" in auth) return json(503, { error: "No se pudo verificar la sesión. Reintenta." });
  const business = auth.business;
  if (!business) return json(401, { error: "Inicia sesión para subir imágenes." });

  // Corte temprano antes de leer el cuerpo entero.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > 3_500_000) return json(413, { error: "La imagen pesa demasiado." });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, { error: "Solicitud inválida." });
  }

  const kindParsed = kindSchema.safeParse(form.get("kind"));
  if (!kindParsed.success) return json(400, { error: "Tipo de imagen inválido." });
  const kind: MediaKind = kindParsed.data;
  const spec = KIND_SPECS[kind];

  const image = form.get("image");
  const thumb = form.get("thumb");
  if (!(image instanceof Blob) || !(thumb instanceof Blob)) {
    return json(400, { error: "Faltan la imagen o la miniatura." });
  }
  if (image.size === 0 || thumb.size === 0) return json(400, { error: "Imagen vacía." });
  if (image.size > spec.main.maxBytes || thumb.size > spec.thumb.maxBytes) {
    return json(413, { error: "La imagen pesa demasiado tras comprimirla." });
  }

  const [mainBytes, thumbBytes] = await Promise.all([
    image.arrayBuffer().then((b) => new Uint8Array(b)),
    thumb.arrayBuffer().then((b) => new Uint8Array(b)),
  ]);

  const mainInfo = sniffImage(mainBytes);
  const thumbInfo = sniffImage(thumbBytes);
  if (!mainInfo || !thumbInfo || mainInfo.type !== thumbInfo.type) {
    return json(415, { error: "Formato no admitido. Solo se aceptan WebP o JPEG." });
  }
  // Margen de 1 px por redondeos del recorte.
  if (
    mainInfo.width > spec.main.maxW + 1 ||
    mainInfo.height > spec.main.maxH + 1 ||
    thumbInfo.width > spec.thumb.maxW + 1 ||
    thumbInfo.height > spec.thumb.maxH + 1
  ) {
    return json(422, { error: "Las dimensiones de la imagen no son válidas." });
  }

  const key = buildKey(kind, business.id, crypto.randomUUID(), mainInfo.ext);

  try {
    await Promise.all([
      putObject(key, mainBytes, mainInfo.type, business.id),
      putObject(thumbKeyOf(key), thumbBytes, thumbInfo.type, business.id),
    ]);
  } catch (err) {
    console.error("[uploads] Error al escribir en R2", err);
    await deleteMedia([key]);
    if (err instanceof MediaConfigError) {
      return json(500, { error: "El almacenamiento de imágenes no está configurado." });
    }
    return json(502, { error: "No se pudo guardar la imagen. Reintenta." });
  }

  return json(201, {
    key,
    w: mainInfo.width,
    h: mainInfo.height,
    url: mediaUrl(key),
    thumbUrl: thumbUrl(key),
  });
}

/**
 * Descarta imágenes subidas que no se llegaron a guardar (p. ej. se cerró el
 * formulario sin guardar). Solo borra claves del propio negocio que NO estén
 * referenciadas en la BD, así que no puede romper un producto o catálogo.
 */
const discardSchema = z.object({ keys: z.array(z.string().max(200)).min(1).max(10) });

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: "Origen no permitido." });

  const auth = await requireBusinessForApi();
  if ("unavailable" in auth) return json(503, { error: "Reintenta." });
  const business = auth.business;
  if (!business) return json(401, { error: "No autorizado." });

  const parsed = discardSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "Solicitud inválida." });

  const candidates = parsed.data.keys.filter((k) => parseMainKey(k)?.businessId === business.id);
  if (candidates.length === 0) return json(200, { deleted: 0 });

  const supabase = await createClient();
  const referenced = new Set<string>();

  const [products, catalogs] = await Promise.all([
    supabase.from("product").select("images").eq("business_id", business.id),
    supabase.from("catalog").select("logo_key, banner_key").eq("business_id", business.id),
  ]);
  if (products.error || catalogs.error) return json(500, { error: "No se pudo verificar." });

  for (const p of (products.data ?? []) as { images: { key: string }[] | null }[]) {
    for (const img of p.images ?? []) referenced.add(img.key);
  }
  for (const c of (catalogs.data ?? []) as { logo_key: string | null; banner_key: string | null }[]) {
    if (c.logo_key) referenced.add(c.logo_key);
    if (c.banner_key) referenced.add(c.banner_key);
  }
  if (business.logo_key) referenced.add(business.logo_key);
  if (business.banner_key) referenced.add(business.banner_key);

  const toDelete = candidates.filter((k) => !referenced.has(k));
  await deleteMedia(toDelete);
  return json(200, { deleted: toDelete.length });
}
