import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/errors.js";
import { publicClient } from "@/lib/supabase.js";
import type { Order, OrderStatus } from "@/types/database.js";
import type { PlaceOrderInput } from "@/schemas/order.schema.js";

export interface PlacedOrder {
  orderId: string;
  totalCents: number;
  currency: string;
}

export const orderService = {
  /**
   * Crea un pedido desde el catálogo público. NO confía en precios del cliente:
   * el RPC place_order recalcula el total desde la BD. Corre como anon.
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
      throw ApiError.badRequest("No se pudo enviar el pedido. Verifica los datos e intenta de nuevo.");
    }
    const r = data as { order_id: string; total_cents: number; currency: string };
    return { orderId: r.order_id, totalCents: r.total_cents, currency: r.currency };
  },

  async list(db: SupabaseClient, businessId: string): Promise<Order[]> {
    const { data, error } = await db
      .from("order")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(502, "No se pudieron cargar los pedidos.", "db_error");
    return (data ?? []) as Order[];
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
