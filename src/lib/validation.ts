import { z } from "zod";
import { THEMES } from "@/lib/themes";

const themeIds = THEMES.map((t) => t.id) as [string, ...string[]];

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,80}$/, "Solo minúsculas, números y guiones (2-80).");

export const businessSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  slug: slugSchema.max(60),
  whatsapp: z.string().trim().max(25).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  theme: z.enum(themeIds),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(200),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  // Precio recibido como texto (input); se convierte a centavos en la acción.
  price: z.coerce.number().min(0, "Precio inválido").max(100_000_000),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  stock: z.coerce.number().int().min(0).max(10_000_000).default(0),
  min_order_qty: z.coerce.number().int().min(1).max(1_000_000).default(1),
  image_url: z.string().trim().url().max(600).optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
});

export const catalogSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  display_name: z.string().trim().max(120).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(25).optional().or(z.literal("")),
  theme: z.enum(themeIds).optional().or(z.literal("")),
  is_public: z.coerce.boolean().default(false),
});

export const orderStatusSchema = z.enum(["pending", "confirmed", "shipped", "cancelled"]);

/** Ítem del carrito enviado al RPC place_order (sólo id + cantidad; el precio
 * lo recalcula el servidor). */
export const orderItemInputSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(100000),
});

export const placeOrderSchema = z.object({
  catalog_slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  whatsapp: z.string().trim().min(5).max(25),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(orderItemInputSchema).min(1).max(200),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CatalogInput = z.infer<typeof catalogSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
