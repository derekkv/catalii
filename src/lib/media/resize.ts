/**
 * Procesado de imágenes EN EL NAVEGADOR antes de subirlas.
 *
 * Por qué en el cliente y no en el Worker:
 *  · Un Worker tiene límites de CPU/memoria; decodificar una foto de 12 MP de
 *    un móvil los supera con facilidad. El navegador lo hace con aceleración.
 *  · Se sube ~200 KB en vez de ~5 MB: en una conexión 3G la diferencia es
 *    la que hay entre que funcione o no.
 *
 * El servidor NO confía en esto: vuelve a validar formato, dimensiones y peso
 * (src/lib/media/server.ts → sniffImage).
 */

import { KIND_SPECS, MAX_SOURCE_BYTES, type MediaKind, type VariantSpec } from "./config";

export interface ProcessedImage {
  main: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

export class ImageProcessingError extends Error {}

type Source = ImageBitmap | HTMLImageElement;

function sourceSize(src: Source) {
  return src instanceof HTMLImageElement
    ? { w: src.naturalWidth, h: src.naturalHeight }
    : { w: src.width, h: src.height };
}

async function decode(file: File): Promise<{ source: Source; release: () => void }> {
  // createImageBitmap respeta la orientación EXIF (fotos de móvil giradas).
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, release: () => bmp.close() };
    } catch {
      /* Safari antiguo o formato no soportado: se intenta con <img>. */
    }
  }
  // La URL se revoca después de dibujar, no antes: algunos navegadores
  // descartan la imagen decodificada al revocarla.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageProcessingError(
      "No se pudo leer la imagen. Usa JPG, PNG o WebP (las fotos HEIC del iPhone deben exportarse antes).",
    );
  }
}

/** Rectángulo de recorte centrado para forzar una relación de aspecto. */
function cropRect(w: number, h: number, aspect: number | null) {
  if (!aspect) return { sx: 0, sy: 0, sw: w, sh: h };
  if (w / h > aspect) {
    const sw = Math.round(h * aspect);
    return { sx: Math.round((w - sw) / 2), sy: 0, sw, sh: h };
  }
  const sh = Math.round(w / aspect);
  return { sx: 0, sy: Math.round((h - sh) / 2), sw: w, sh };
}

/** Escala para caber en maxW×maxH sin agrandar nunca. */
function fit(w: number, h: number, maxW: number, maxH: number) {
  const scale = Math.min(1, maxW / w, maxH / h);
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * WebP si el navegador sabe codificarlo; si no (Safari < 16 devuelve PNG en
 * silencio), JPEG sobre fondo blanco para que las transparencias no salgan negras.
 */
async function encode(canvas: HTMLCanvasElement, spec: VariantSpec, format: "webp" | "jpeg" | null) {
  if (format !== "jpeg") {
    const webp = await toBlob(canvas, "image/webp", spec.quality);
    if (webp && webp.type === "image/webp") return { blob: webp, format: "webp" as const };
  }
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);
  const jpeg = await toBlob(flat, "image/jpeg", spec.quality);
  if (!jpeg) throw new ImageProcessingError("Tu navegador no pudo comprimir la imagen.");
  return { blob: jpeg, format: "jpeg" as const };
}

function render(
  src: CanvasImageSource,
  rect: { sx: number; sy: number; sw: number; sh: number },
  w: number,
  h: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageProcessingError("Tu navegador no permite procesar imágenes.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);
  return canvas;
}

/**
 * Genera la versión optimizada y la miniatura. Si el resultado aún pesa más
 * de lo permitido se reintenta bajando calidad.
 */
export async function processImage(file: File, kind: MediaKind): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) {
    throw new ImageProcessingError("El archivo no es una imagen.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageProcessingError("La imagen pesa más de 20 MB.");
  }

  const spec = KIND_SPECS[kind];
  const { source, release } = await decode(file);
  try {
    const { w, h } = sourceSize(source);
    if (!w || !h) throw new ImageProcessingError("La imagen está vacía o dañada.");
    if (w < 64 || h < 64) throw new ImageProcessingError("La imagen es demasiado pequeña.");

    const rect = cropRect(w, h, spec.aspect);
    const mainSize = fit(rect.sw, rect.sh, spec.main.maxW, spec.main.maxH);
    const mainCanvas = render(source, rect, mainSize.w, mainSize.h);

    // Calidad decreciente hasta respetar el límite de peso.
    let main = await encode(mainCanvas, spec.main, null);
    for (let q = spec.main.quality - 0.1; main.blob.size > spec.main.maxBytes && q >= 0.4; q -= 0.1) {
      main = await encode(mainCanvas, { ...spec.main, quality: q }, main.format);
    }
    if (main.blob.size > spec.main.maxBytes) {
      throw new ImageProcessingError("No se pudo reducir la imagen lo suficiente.");
    }

    // La miniatura sale de la versión ya redimensionada: mismo recorte y formato.
    const thumbSize = fit(mainSize.w, mainSize.h, spec.thumb.maxW, spec.thumb.maxH);
    const thumbCanvas = render(
      mainCanvas,
      { sx: 0, sy: 0, sw: mainSize.w, sh: mainSize.h },
      thumbSize.w,
      thumbSize.h,
    );
    let thumb = await encode(thumbCanvas, spec.thumb, main.format);
    for (let q = spec.thumb.quality - 0.1; thumb.blob.size > spec.thumb.maxBytes && q >= 0.4; q -= 0.1) {
      thumb = await encode(thumbCanvas, { ...spec.thumb, quality: q }, main.format);
    }

    return { main: main.blob, thumb: thumb.blob, width: mainSize.w, height: mainSize.h };
  } finally {
    release();
  }
}
