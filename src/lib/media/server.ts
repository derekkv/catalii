import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  BUCKET_BINDING,
  KIND_BUCKET,
  parseMainKey,
  splitKey,
  thumbKeyOf,
  type BucketAlias,
  type MediaKind,
} from "./config";

/*
 * Acceso a los buckets R2 de medios.
 *
 * Se tipa solo la parte de la API de R2 que se usa, para no depender de
 * @cloudflare/workers-types (no está instalado y `cloudflare-env.d.ts` es un
 * archivo generado e ignorado por git).
 */

export interface R2ObjectLike {
  key: string;
  size: number;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: { contentType?: string; cacheControl?: string };
}

export interface R2ObjectBodyLike extends R2ObjectLike {
  body: ReadableStream;
}

export interface R2BucketLike {
  head(key: string): Promise<R2ObjectLike | null>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | ReadableStream,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<R2ObjectLike | null>;
  delete(keys: string | string[]): Promise<void>;
}

export class MediaConfigError extends Error {
  constructor(binding: string) {
    super(
      `Falta el binding R2 "${binding}". Decláralo en wrangler.jsonc (y wrangler.dev.jsonc para next dev).`,
    );
    this.name = "MediaConfigError";
  }
}

/** Las claves llevan uuid: un objeto nunca cambia, se puede cachear para siempre. */
export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export function getBucket(alias: BucketAlias): R2BucketLike {
  const binding = BUCKET_BINDING[alias];
  const { env } = getCloudflareContext();
  const bucket = (env as unknown as Record<string, unknown>)[binding] as R2BucketLike | undefined;
  if (!bucket) throw new MediaConfigError(binding);
  return bucket;
}

/* ── Validación del contenido (no se confía en el Content-Type del cliente) ── */

export interface SniffedImage {
  type: "image/webp" | "image/jpeg";
  ext: "webp" | "jpg";
  width: number;
  height: number;
}

function u16be(b: Uint8Array, o: number) {
  return (b[o] << 8) | b[o + 1];
}
function u24le(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
}

/** Lee formato y dimensiones de los bytes. Solo WebP y JPEG (lo que genera el navegador). */
export function sniffImage(b: Uint8Array): SniffedImage | null {
  // WebP: "RIFF" .... "WEBP"
  if (
    b.length >= 30 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
    let width = 0;
    let height = 0;
    if (chunk === "VP8 ") {
      // Lossy: firma 9d 01 2a en el offset 23; dimensiones de 14 bits.
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
      width = (b[26] | (b[27] << 8)) & 0x3fff;
      height = (b[28] | (b[29] << 8)) & 0x3fff;
    } else if (chunk === "VP8L") {
      if (b[20] !== 0x2f) return null;
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    } else if (chunk === "VP8X") {
      width = u24le(b, 24) + 1;
      height = u24le(b, 27) + 1;
    } else {
      return null;
    }
    return width > 0 && height > 0 ? { type: "image/webp", ext: "webp", width, height } : null;
  }

  // JPEG: FF D8, se recorren los segmentos hasta un SOFn.
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = b[o + 1];
      if (marker === 0xff) {
        o++;
        continue;
      }
      // Marcadores sin longitud
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        o += 2;
        continue;
      }
      const len = u16be(b, o + 2);
      const isSof =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        const height = u16be(b, o + 5);
        const width = u16be(b, o + 7);
        return width > 0 && height > 0 ? { type: "image/jpeg", ext: "jpg", width, height } : null;
      }
      if (marker === 0xda || len < 2) break; // inicio de datos sin SOF: inválido
      o += 2 + len;
    }
  }
  return null;
}

/* ── Operaciones ──────────────────────────────────────────────────────────── */

export async function putObject(key: string, bytes: Uint8Array, contentType: string, businessId: string) {
  const parts = splitKey(key);
  if (!parts) throw new Error(`Clave de medio inválida: ${key}`);
  await getBucket(parts.bucket).put(parts.objectKey, bytes, {
    httpMetadata: { contentType, cacheControl: IMMUTABLE_CACHE },
    customMetadata: { business: businessId },
  });
}

export async function objectExists(key: string): Promise<boolean> {
  const parts = splitKey(key);
  if (!parts) return false;
  return (await getBucket(parts.bucket).head(parts.objectKey)) !== null;
}

/**
 * Borra imágenes (principal + miniatura). Nunca lanza: un objeto huérfano en
 * R2 es preferible a que falle la acción del usuario después de haber
 * guardado en la BD.
 */
export async function deleteMedia(keys: (string | null | undefined)[]): Promise<void> {
  const byBucket = new Map<BucketAlias, string[]>();
  for (const key of keys) {
    if (!key || !parseMainKey(key)) continue;
    for (const k of [key, thumbKeyOf(key)]) {
      const parts = splitKey(k);
      if (!parts) continue;
      const list = byBucket.get(parts.bucket) ?? [];
      list.push(parts.objectKey);
      byBucket.set(parts.bucket, list);
    }
  }
  await Promise.all(
    [...byBucket].map(async ([alias, objectKeys]) => {
      try {
        await getBucket(alias).delete(objectKeys);
      } catch (err) {
        console.error(`[media] No se pudieron borrar ${objectKeys.length} objetos de ${alias}`, err);
      }
    }),
  );
}

/**
 * ¿La clave es una imagen principal de este negocio y de este tipo?
 * Defensa contra que un usuario asocie a su producto imágenes de otro negocio.
 */
export function ownsKey(key: string, businessId: string, kind: MediaKind): boolean {
  const parsed = parseMainKey(key);
  return parsed !== null && parsed.businessId === businessId && parsed.bucket === KIND_BUCKET[kind];
}

/** Valida que una clave nueva sea del negocio, del tipo correcto y exista en R2. */
export async function assertUploadedKey(key: string, businessId: string, kind: MediaKind) {
  if (!ownsKey(key, businessId, kind)) return false;
  return objectExists(key);
}
