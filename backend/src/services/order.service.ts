import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/errors.js";
import { publicClient } from "@/lib/supabase.js";
import type { Order, OrderItem, OrderStatus } from "@/types/database.js";
import type { PlaceOrderInput } from "@/schemas/order.schema.js";

export interface PlacedOrder {
  orderId: string;
  totalCents: number;
  currency: string;
}

/** Pedido con sus renglones, como lo necesita el panel. */
export type OrderWithItems = Order & { order_item: OrderItem[] };

/**
 * Traducción de los SQLSTATE propios de `place_order` (ver
 * `supabase/migrations/0007_order_limits_and_indexes.sql`). Se ramifica por
 * código, nunca por el texto del error: el mensaje de Postgres no sale de aquí.
 *
 * Los mismos textos están en `src/lib/actions/order-actions.ts` (camino sin
 * backend): si tocas uno, toca el otro.
 */
const RPC_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  // Límite de frecuencia dentro del RPC (#22). Complementa, no sustituye, a
  // `placeOrderLimiter` del router: ese limita por IP y solo cubre a quien
  // pasa por este backend.
  PT429: {
    status: 429,
    code: "rate_limited",
    message:
      "Estamos recibiendo demasiados pedidos en este catálogo. Espera unos minutos e intenta de nuevo.",
  },
  // El plan del negocio agotó sus pedidos del mes (#29).
  PT402: {
    status: 409,
    code: "orders_limit_reached",
    message: "Este catálogo no puede recibir más pedidos por ahora. Contacta al vendedor.",
  },
};

export const orderService = {
  /**
   * Crea un pedido desde el catálogo público. NO confía en precios del cliente:
   * el RPC place_order recalcula el total desde la BD. Corre como anon.
   *
   * El RPC también aplica el límite mensual de pedidos del plan (#29) y un
   * límite de frecuencia por catálogo y teléfono (#22), y los señala con un
   * SQLSTATE propio que se traduce en RPC_ERRORS.
   */
  async place(input: PlaceOrderInput): Promise<PlacedOrder> {
    const db = publicClient();
    const { data, error } = await db.rpc("place_order", {
      p_catalog_slug: input.catalog_slug,
      p_name: input.name,
      p_whatsapp: input.whatsapp,
      p_email: input.email ?? null,
      p_notes: input.notes ?? null,
      p_items: input.items,
    });
    if (error) {
      const mapped = RPC_ERRORS[error.code ?? ""];
      if (mapped) throw new ApiError(mapped.status, mapped.message, mapped.code);
      throw ApiError.badRequest("No se pudo enviar el pedido. Verifica los datos e intenta de nuevo.");
    }
    const r = data as { order_id: string; total_cents: number; currency: string };
    return { orderId: r.order_id, totalCents: r.total_cents, currency: r.currency };
  },

  async list(db: SupabaseClient, businessId: string): Promise<OrderWithItems[]> {
    const { data, error } = await db
      .from("order")
      .select("*, order_item(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new ApiError(502, "No se pudieron cargar los pedidos.", "db_error");
    return (data ?? []) as OrderWithItems[];
  },

  async updateStatus(
    db: SupabaseClient,
    businessId: string,
    id: string,
    status: OrderStatus,
  ): Promise<Order> {
    const { data, error } = await db
      .from("order")
      .update({ status })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError(502, "No se pudo actualizar el pedido.", "db_error");
    if (!data) throw ApiError.notFound("Pedido no encontrado.");
    return data as Order;
  },
};
