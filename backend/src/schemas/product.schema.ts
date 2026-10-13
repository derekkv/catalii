import { z } from "zod";
import { MAX_PRODUCT_IMAGES, optionalText, storedImageSchema } from "@/schemas/common.js";

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
  image_url: z.string().trim().url().max(600).optional().or(z.literal("")).transform((v) => v || undefined),
  images: z.array(storedImageSchema).max(MAX_PRODUCT_IMAGES).default([]),
  active: z.boolean().default(true),
});

/** En update todo es opcional: se parchea solo lo enviado. */
export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
