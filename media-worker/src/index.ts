/**
 * Catalii Media — Worker dedicado a servir imágenes desde R2.
 *
 * Servidor aparte de la app: sirve solo GET/HEAD de objetos públicos, sin
 * Next.js, sin middleware de sesión y con caché de borde (Cache API). La app
 * sube las imágenes (POST /api/uploads) y este Worker las entrega.
 *
 *   GET https://media.catalii.com/<bucket>/<business_id>/<uuid>[_t].<webp|jpg>
 *
 * <bucket> ∈ products | logos | banners → binding MEDIA_PRODUCTS / _LOGOS / _BANNERS.
 * Las claves llevan uuid, así que los objetos son inmutables y se cachean un año.
 */

// Tipos mínimos de la API de Workers usada (sin depender de @cloudflare/workers-types).
interface R2ObjectBody {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
}
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}
interface Env {
  MEDIA_PRODUCTS: R2Bucket;
  MEDIA_LOGOS: R2Bucket;
  MEDIA_BANNERS: R2Bucket;
  /** Orígenes permitidos para CORS, separados por coma. Por defecto "*". */
  ALLOWED_ORIGINS?: string;
}
interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const KEY_RE = new RegExp(`^/(products|logos|banners)/(${UUID}/${UUID}(?:_t)?\\.(?:webp|jpg))$`);
const IMMUTABLE = "public, max-age=31536000, immutable";

const BUCKETS: Record<string, keyof Pick<Env, "MEDIA_PRODUCTS" | "MEDIA_LOGOS" | "MEDIA_BANNERS">> = {
  products: "MEDIA_PRODUCTS",
  logos: "MEDIA_LOGOS",
  banners: "MEDIA_BANNERS",
};

function corsOrigin(req: Request, env: Env): string {
  const allowed = (env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim());
  if (allowed.includes("*")) return "*";
  const origin = req.headers.get("origin") ?? "";
  return allowed.includes(origin) ? origin : allowed[0] ?? "";
}

function baseHeaders(req: Request, env: Env): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": corsOrigin(req, env),
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "cross-origin",
    Vary: "Origin",
  });
}

const handler = {
  async fetch(req: Request, env: Env, ctx: Ctx): Promise<Response> {
    if (req.method === "OPTIONS") {
      const h = baseHeaders(req, env);
      h.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      h.set("Access-Control-Max-Age", "86400");
      return new Response(null, { status: 204, headers: h });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("ok", { headers: { "Cache-Control": "no-store" } });
    }

    const m = KEY_RE.exec(url.pathname);
    if (!m) return new Response("Not found", { status: 404 });

    // Caché de borde: clave sin query string para que no se pueda saltar.
    const cacheKey = new Request(`${url.origin}${url.pathname}`, { method: "GET" });
    const cache = (caches as unknown as { default: Cache }).default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      if (req.headers.get("if-none-match") === cached.headers.get("etag")) {
        return new Response(null, { status: 304, headers: cached.headers });
      }
      return req.method === "HEAD" ? new Response(null, { headers: cached.headers }) : cached;
    }

    const bucket = env[BUCKETS[m[1]]];
    if (!bucket) return new Response("Bucket not configured", { status: 500 });

    const object = await bucket.get(m[2]);
    if (!object) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    const headers = baseHeaders(req, env);
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
    headers.set("Cache-Control", IMMUTABLE);
    headers.set("ETag", object.httpEtag);
    headers.set("Content-Length", String(object.size));

    if (req.headers.get("if-none-match") === object.httpEtag) {
      await object.body.cancel().catch(() => {});
      return new Response(null, { status: 304, headers });
    }

    const response = new Response(object.body, { status: 200, headers });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return req.method === "HEAD" ? new Response(null, { headers }) : response;
  },
};

export default handler;
