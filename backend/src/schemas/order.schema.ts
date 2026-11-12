import { z } from "zod";
import { optionalText, slugSchema } from "@/schemas/common.js";

export const orderStatusSchema = z.enum(["pending", "confirmed", "shipped", "cancelled"]);

/** Ítem del carrito: solo id + cantidad. El precio lo recalcula el RPC. */
export const orderItemInputSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(100_000),
});

export const placeOrderSchema = z.object({
  catalog_slug: slugSchema,
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  whatsapp: z.string().trim().min(5, "WhatsApp inválido").max(25),
  email: z.string().trim().email().max(160).optional().or(z.literal("")).transform((v) => v || undefined),
  notes: optionalText(1000),
  items: z.array(orderItemInputSchema).min(1, "El pedido está vacío.").max(200),
});

export const updateStatusSchema = z.object({ status: orderStatusSchema });

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
