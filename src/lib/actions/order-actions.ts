"use server";

import { createClient } from "@/lib/supabase/server";
import { backendEnabled, backendFetch } from "@/lib/backend";
import { placeOrderSchema } from "@/lib/validation";

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  totalCents?: number;
  currency?: string;
  error?: string;
}

interface PlaceOrderInput {
  catalogSlug: string;
  name: string;
  whatsapp: string;
  email?: string;
  notes?: string;
  items: { product_id: string; quantity: number }[];
}

/**
 * Mensajes para el comprador según el SQLSTATE con el que falla `place_order`.
 *
 * El RPC lanza códigos propios (ver
 * `supabase/migrations/0007_order_limits_and_indexes.sql`) para que aquí se
 * pueda ramificar sin leer el texto del error de Postgres. El mensaje que ve
 * el comprador se escribe AQUÍ: nunca se reenvía `error.message`, que puede
 * traer detalles internos (nombres de tabla, restricciones, umbrales).
 *
 * El backend Express traduce los mismos códigos a los mismos textos
 * (`backend/src/services/order.service.ts`): si tocas uno, toca el otro.
 */
const RPC_ERROR_MESSAGES: Record<string, string> = {
  // Límite de frecuencia: demasiados pedidos seguidos en este catálogo (#22).
  PT429: "Estamos recibiendo demasiados pedidos en este catálogo. Espera unos minutos e intenta de nuevo.",
  // El plan del vendedor agotó sus pedidos del mes (#29). El comprador no
  // tiene culpa ni puede arreglarlo: se le dice a quién acudir, sin mencionar
  // planes ni cupos del negocio.
  PT402: "Este catálogo no puede recibir más pedidos por ahora. Contacta al vendedor.",
};

const GENERIC_ORDER_ERROR = "No se pudo enviar el pedido. Verifica los datos e intenta de nuevo.";

/**
 * Crea un pedido desde el catálogo público. NO confía en precios del cliente:
 * el RPC place_order recalcula todo desde la BD. Se ejecuta con el cliente
 * anónimo (RLS + grant execute a anon).
 */
export async function submitOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse({
    catalog_slug: input.catalogSlug,
    name: input.name,
    whatsapp: input.whatsapp,
    email: input.email ?? "",
    notes: input.notes ?? "",
    items: input.items,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos del pedido inválidos." };
  }
  const d = parsed.data;

  if (backendEnabled()) {
    // Ruta pública: sin token. El backend vuelve a validar y recalcula precios.
    const res = await backendFetch<{ orderId: string; totalCents: number; currency: string }>(
      "/api/orders",
      {
        method: "POST",
        auth: false,
        body: {
          catalog_slug: d.catalog_slug,
          name: d.name,
          whatsapp: d.whatsapp,
          email: d.email || undefined,
          notes: d.notes || undefined,
          items: d.items,
        },
      },
    );
    if (!res.ok) return { ok: false, error: res.message };
    return { ok: true, ...res.data };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_catalog_slug: d.catalog_slug,
    p_name: d.name,
    p_whatsapp: d.whatsapp,
    p_email: d.email || null,
    p_notes: d.notes || null,
    p_items: d.items,
  });

  if (error) {
    // `error.code` es el SQLSTATE que devuelve PostgREST. Si es uno de los
    // nuestros, el comprador recibe el motivo; si no, mensaje genérico.
    return { ok: false, error: RPC_ERROR_MESSAGES[error.code ?? ""] ?? GENERIC_ORDER_ERROR };
  }

  const result = data as { order_id: string; total_cents: number; currency: string };
  return {
    ok: true,
    orderId: result.order_id,
    totalCents: result.total_cents,
    currency: result.currency,
  };
}
