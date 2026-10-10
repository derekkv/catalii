/**
 * Configuración de medios compartida por cliente y servidor.
 *
 * Las imágenes viven en tres buckets R2 separados (uno por tipo). En la BD se
 * guarda solo la clave `<bucket>/<business_id>/<uuid>.<ext>`; el primer
 * segmento identifica el bucket y el resto es la clave del objeto dentro de él.
 * Cada imagen tiene dos objetos: la versión optimizada y su miniatura
 * (`<uuid>_t.<ext>`), que se deriva de la clave y no se guarda.
 */

export type MediaKind = "product" | "logo" | "banner";
export type BucketAlias = "products" | "logos" | "banners";

/** Tipo de imagen → bucket. */
export const KIND_BUCKET: Record<MediaKind, BucketAlias> = {
  product: "products",
  logo: "logos",
  banner: "banners",
};

/** Bucket → nombre del binding R2 en wrangler.jsonc. */
export const BUCKET_BINDING: Record<BucketAlias, string> = {
  products: "MEDIA_PRODUCTS",
  logos: "MEDIA_LOGOS",
  banners: "MEDIA_BANNERS",
};

export interface VariantSpec {
  /** Ancho/alto máximos al redimensionar en el navegador. */
  maxW: number;
  maxH: number;
  quality: number;
  /** Límite duro que valida el servidor. */
  maxBytes: number;
}

export interface KindSpec {
  /** Relación de aspecto forzada (recorte centrado). `null` = la original. */
  aspect: number | null;
  main: VariantSpec;
  thumb: VariantSpec;
  label: string;
}

/**
 * Tamaños de salida. Valores pensados para la UI real:
 *  · producto: rejilla de 2-4 columnas (miniatura) y detalle a pantalla.
 *  · logo: avatar cuadrado de 40 px en cabecera (miniatura) y 512 para OG.
 *  · banner: 3:1, se muestra a ~768 px de ancho como máximo.
 */
export const KIND_SPECS: Record<MediaKind, KindSpec> = {
  product: {
    aspect: null,
    main: { maxW: 1600, maxH: 1600, quality: 0.82, maxBytes: 1_500_000 },
    thumb: { maxW: 480, maxH: 480, quality: 0.75, maxBytes: 250_000 },
    label: "Foto de producto",
  },
  logo: {
    aspect: 1,
    main: { maxW: 512, maxH: 512, quality: 0.85, maxBytes: 500_000 },
    thumb: { maxW: 128, maxH: 128, quality: 0.8, maxBytes: 80_000 },
    label: "Logo",
  },
  banner: {
    aspect: 3,
    main: { maxW: 1800, maxH: 600, quality: 0.82, maxBytes: 1_200_000 },
    thumb: { maxW: 600, maxH: 200, quality: 0.75, maxBytes: 200_000 },
    label: "Banner",
  },
};

export const MAX_PRODUCT_IMAGES = 3;

/** Tamaño máximo del archivo ORIGINAL que acepta el navegador antes de comprimir. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** Clave de una imagen principal (sin `_t`). */
export const MAIN_KEY_RE = new RegExp(`^(products|logos|banners)/(${UUID})/(${UUID})\\.(webp|jpg)$`);
/** Clave de cualquier objeto servible (principal o miniatura). */
export const ANY_KEY_RE = new RegExp(`^(products|logos|banners)/${UUID}/${UUID}(_t)?\\.(webp|jpg)$`);

export interface ParsedKey {
  bucket: BucketAlias;
  businessId: string;
  id: string;
  ext: "webp" | "jpg";
}

export function parseMainKey(key: string): ParsedKey | null {
  const m = MAIN_KEY_RE.exec(key);
  if (!m) return null;
  return { bucket: m[1] as BucketAlias, businessId: m[2], id: m[3], ext: m[4] as "webp" | "jpg" };
}

export function buildKey(kind: MediaKind, businessId: string, id: string, ext: "webp" | "jpg") {
  return `${KIND_BUCKET[kind]}/${businessId}/${id}.${ext}`;
}

/** `products/a/b.webp` → `products/a/b_t.webp` */
export function thumbKeyOf(key: string): string {
  return key.replace(/\.(webp|jpg)$/, "_t.$1");
}

/** Separa `products/a/b.webp` en bucket + clave del objeto dentro del bucket. */
export function splitKey(key: string): { bucket: BucketAlias; objectKey: string } | null {
  if (!ANY_KEY_RE.test(key)) return null;
  const i = key.indexOf("/");
  return { bucket: key.slice(0, i) as BucketAlias, objectKey: key.slice(i + 1) };
}

/**
 * Base pública de medios. Si `NEXT_PUBLIC_MEDIA_URL` apunta al Worker de
 * medios dedicado (media-worker/, p. ej. https://media.catalii.com), las
 * imágenes se sirven desde ahí. Si no, la propia app las sirve en /api/media.
 */
function mediaBase(): string {
  const env = process.env.NEXT_PUBLIC_MEDIA_URL;
  return env ? env.replace(/\/$/, "") : "/api/media";
}

export function mediaUrl(key: string): string {
  return `${mediaBase()}/${key}`;
}

export function thumbUrl(key: string): string {
  return mediaUrl(thumbKeyOf(key));
}

/** Para metadatos OG/JSON-LD, que exigen URL absoluta. */
export function absoluteUrl(url: string, siteUrl: string): string {
  return /^https?:\/\//.test(url) ? url : `${siteUrl}${url}`;
}

/* ── Resolución de imágenes con fallback a URLs externas ──────────────────── */

export interface ResolvedImage {
  src: string;
  thumb: string;
  w?: number;
  h?: number;
}

/** Imágenes de un producto: subidas (R2) o, si no hay, la URL externa. */
export function productImages(p: {
  images?: { key: string; w: number; h: number }[] | null;
  image_url?: string | null;
}): ResolvedImage[] {
  const uploaded = (p.images ?? []).filter((i) => i && typeof i.key === "string");
  if (uploaded.length > 0) {
    return uploaded.map((i) => ({ src: mediaUrl(i.key), thumb: thumbUrl(i.key), w: i.w, h: i.h }));
  }
  return p.image_url ? [{ src: p.image_url, thumb: p.image_url }] : [];
}

/** Clave subida → URL; si no, URL externa; si no, null. */
export function resolveBrandImage(
  key: string | null | undefined,
  url: string | null | undefined,
  variant: "main" | "thumb" = "main",
): string | null {
  if (key) return variant === "thumb" ? thumbUrl(key) : mediaUrl(key);
  return url || null;
}
