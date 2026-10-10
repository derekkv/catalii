"use client";

import { processImage, ImageProcessingError } from "./resize";
import type { MediaKind } from "./config";

export interface UploadedImage {
  key: string;
  w: number;
  h: number;
  url: string;
  thumbUrl: string;
}

export class UploadError extends Error {}

/** Comprime en el navegador y sube imagen + miniatura a /api/uploads. */
export async function uploadImage(file: File, kind: MediaKind): Promise<UploadedImage> {
  let processed;
  try {
    processed = await processImage(file, kind);
  } catch (err) {
    if (err instanceof ImageProcessingError) throw new UploadError(err.message);
    throw new UploadError("No se pudo procesar la imagen.");
  }

  const ext = processed.main.type === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.set("kind", kind);
  form.set("image", processed.main, `image.${ext}`);
  form.set("thumb", processed.thumb, `thumb.${ext}`);

  let res: Response;
  try {
    res = await fetch("/api/uploads", { method: "POST", body: form, credentials: "same-origin" });
  } catch {
    throw new UploadError("Sin conexión. Revisa tu internet e inténtalo de nuevo.");
  }

  const body = (await res.json().catch(() => ({}))) as Partial<UploadedImage> & { error?: string };
  if (!res.ok || !body.key) {
    throw new UploadError(body.error ?? "No se pudo subir la imagen.");
  }
  return body as UploadedImage;
}

/**
 * Borra imágenes subidas que no se guardaron. `keepalive` permite que la
 * petición termine aunque el usuario cierre el panel o la pestaña.
 */
export function discardImages(keys: string[]): void {
  if (keys.length === 0) return;
  fetch("/api/uploads", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {
    /* best-effort: lo peor es un objeto huérfano en R2 */
  });
}
