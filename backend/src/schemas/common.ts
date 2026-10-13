import { z } from "zod";

/** Clave de imagen principal en R2: <bucket>/<business>/<uuid>.<ext>. */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const MAIN_KEY_RE = new RegExp(`^(products|logos|banners)/${UUID}/${UUID}\\.(webp|jpg)$`);

export const MAX_PRODUCT_IMAGES = 3;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,80}$/, "Solo minúsculas, números y guiones (2-80).");

/** Trae un texto opcional a `string | undefined` quitando los vacíos. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const storedImageSchema = z.object({
  key: z.string().regex(MAIN_KEY_RE, "Imagen inválida."),
  w: z.number().int().min(1).max(10_000),
  h: z.number().int().min(1).max(10_000),
});
