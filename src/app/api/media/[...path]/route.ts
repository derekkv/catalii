import { splitKey } from "@/lib/media/config";
import { IMMUTABLE_CACHE, MediaConfigError, getBucket } from "@/lib/media/server";

/*
 * Sirve imágenes desde R2 a través de la propia app.
 *
 * Es el fallback cuando no se configura NEXT_PUBLIC_MEDIA_URL. En producción
 * se recomienda el Worker de medios dedicado (media-worker/), que sirve los
 * mismos objetos sin pasar por Next ni por el middleware de sesión.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const parts = splitKey((path ?? []).join("/"));
  if (!parts) return new Response("Not found", { status: 404 });

  let object;
  try {
    object = await getBucket(parts.bucket).get(parts.objectKey);
  } catch (err) {
    if (err instanceof MediaConfigError) console.error(`[media] ${err.message}`);
    else console.error("[media] Error al leer de R2", err);
    return new Response("Unavailable", { status: 503 });
  }
  if (!object) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  }

  const headers = new Headers({
    "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
    "Cache-Control": IMMUTABLE_CACHE,
    ETag: object.httpEtag,
    "Content-Length": String(object.size),
  });

  if (req.headers.get("if-none-match") === object.httpEtag) {
    // Se descarta el cuerpo ya abierto para no dejar el stream colgado.
    await object.body.cancel().catch(() => {});
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body, { status: 200, headers });
}
