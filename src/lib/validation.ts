import { z } from "zod";
import { THEMES } from "@/lib/themes";
import { MAIN_KEY_RE, MAX_PRODUCT_IMAGES } from "@/lib/media/config";

const themeIds = THEMES.map((t) => t.id) as [string, ...string[]];

/**
 * Checkbox de HTML en un FormData: solo cuenta como marcado si llega "true"/
 * "on". No se usa z.coerce.boolean() porque Boolean("false") es true, así que
 * un hidden con value="false" (para los checkbox desmarcados) daría true.
 */
const checkboxBool = z.preprocess((v) => v === true || v === "true" || v === "on", z.boolean());

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
  active: checkboxBool,
});

export const catalogSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  display_name: z.string().trim().max(120).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(25).optional().or(z.literal("")),
  // Branding del catálogo: ya se renderizaban en /c/[slug] pero no había
  // ningún campo en el panel para definirlos.
  logo_url: z.string().trim().url("URL de logo inválida").max(600).optional().or(z.literal("")),
  banner_url: z.string().trim().url("URL de banner inválida").max(600).optional().or(z.literal("")),
  theme: z.enum(themeIds).optional().or(z.literal("")),
  is_public: z.coerce.boolean().default(false),
});

export const orderStatusSchema = z.enum(["pending", "confirmed", "shipped", "cancelled"]);
/**
 * Imágenes de producto enviadas por el formulario (JSON en un campo oculto).
 * El formato de la clave se valida aquí; la propiedad (que sea del negocio) y
 * que exista en R2 se comprueban en la acción.
 */
export const productImagesSchema = z
  .array(
    z.object({
      key: z.string().regex(MAIN_KEY_RE, "Imagen inválida."),
      w: z.number().int().min(1).max(10_000),
      h: z.number().int().min(1).max(10_000),
    }),
  )
  .max(MAX_PRODUCT_IMAGES, `Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto.`)
  .refine((list) => new Set(list.map((i) => i.key)).size === list.length, "Imágenes repetidas.");

/** Clave de logo/banner, o null para quitarla. */
export const brandImageKeySchema = z.string().regex(MAIN_KEY_RE).nullable();

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
