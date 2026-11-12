import { z } from "zod";
import { clearableText, optionalText, slugSchema } from "@/schemas/common.js";

export const createCatalogSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  slug: slugSchema,
  description: optionalText(500),
  display_name: optionalText(120),
  whatsapp: optionalText(25),
  theme: optionalText(40),
  is_public: z.boolean().default(false),
});

export const updateCatalogSchema = createCatalogSchema.partial().extend({
  description: clearableText(500),
  display_name: clearableText(120),
  whatsapp: clearableText(25),
  theme: clearableText(40),
});

export type CreateCatalogInput = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogInput = z.infer<typeof updateCatalogSchema>;
