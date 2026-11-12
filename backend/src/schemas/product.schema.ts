import { z } from "zod";
import { MAX_PRODUCT_IMAGES, clearableText, optionalText, storedImageSchema } from "@/schemas/common.js";

/**
 * ¿URL de imagen remota publicable? Misma regla que el front
 * (`src/lib/validation.ts`): solo `https` y sin credenciales embebidas, porque
 * esa URL acaba como `src` de un `<img>` en el catálogo público y la pide el
 * navegador del comprador. `z.string().url()` no sirve: acepta `http://` y
 * `https://usuario:clave@host`.
 *
 * Duplicado a conciencia mientras siga abierta la tarea #27 (desduplicar
 * esquemas entre front y backend): si cambia uno, cambia el otro.
 */
function isPublishableImageUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return parsed.username === "" && parsed.password === "";
}

const IMAGE_URL_MESSAGE = "La URL de la imagen debe ser https:// (sin usuario ni contraseña).";

/** URL de imagen externa: https, sin credenciales, máximo 600 caracteres. */
const imageUrlSchema = () => z.string().trim().max(600).refine(isPublishableImageUrl, IMAGE_URL_MESSAGE);

/**
 * Entrada de la API (JSON). A diferencia del form del front, el precio llega ya
 * en centavos (entero) para no perder precisión en la red.
 */
export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(200),
  sku: optionalText(60),
  description: optionalText(2000),
  category: optionalText(80),
  price_cents: z.number().int().min(0, "Precio inválido").max(100_000_000_00),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  stock: z.number().int().min(0).max(10_000_000).default(0),
  min_order_qty: z.number().int().min(1).max(1_000_000).default(1),
  image_url: imageUrlSchema().optional().or(z.literal("")).transform((v) => v || undefined),
  images: z.array(storedImageSchema).max(MAX_PRODUCT_IMAGES).default([]),
  active: z.boolean().default(true),
});

/**
 * En update todo es opcional: se parchea solo lo enviado. Los textos opcionales
 * se pueden vaciar enviando "" o null (ver `clearableText`).
 */
export const updateProductSchema = createProductSchema.partial().extend({
  sku: clearableText(60),
  description: clearableText(2000),
  category: clearableText(80),
  image_url: z
    .union([imageUrlSchema(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
