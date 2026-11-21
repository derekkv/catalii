import { z } from "zod";
import { slugSchema } from "@/schemas/common.js";
import { METRIC_KINDS } from "@/types/metrics.js";

/**
 * Entrada del beacon (`POST /api/metrics/events`).
 *
 * NO se usa con `validateBody`: ese middleware responde 400 con el detalle del
 * error y este endpoint debe responder 204 siempre (es un beacon, nadie lee la
 * respuesta). El controlador hace `safeParse` y descarta lo que no encaje.
 *
 * `kind` desconocido —incluido `order_sent`— falla el enum y el evento se tira.
 */
export const trackEventSchema = z
  .object({
    kind: z.enum(METRIC_KINDS),
    catalogSlug: slugSchema.nullish(),
    businessSlug: slugSchema.nullish(),
    /**
     * El front manda ya solo el host. Se acepta también una URL para no
     * depender de que lo haga bien: el controlador se queda con el host.
     */
    referrerHost: z.string().trim().max(2048).nullish(),
    device: z.enum(["mobile", "desktop"]).nullish(),
  })
  // Sin destino no hay nada que contar.
  .refine((v) => Boolean(v.catalogSlug ?? v.businessSlug), "Falta el slug de destino.");

export type TrackEventInput = z.infer<typeof trackEventSchema>;

/**
 * Ventana de las consultas de lectura. 1-365 días: más de un año de eventos no
 * existe (el TTL los borra) y pedir ventanas enormes solo castiga al cluster.
 */
export const metricsQuerySchema = z.object({
  days: z.coerce
    .number({ invalid_type_error: "`days` debe ser un número." })
    .int("`days` debe ser un número entero.")
    .min(1, "`days` debe ser al menos 1.")
    .max(365, "`days` no puede pasar de 365.")
    .default(30),
});

/** El id del negocio viaja en la ruta; si no es un uuid no hace falta consultar. */
export const businessIdParamSchema = z.object({
  businessId: z.string().uuid("Negocio inválido."),
});
