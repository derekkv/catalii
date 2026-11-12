"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { backendEnabled, backendFetch } from "@/lib/backend";
import { orderStatusSchema } from "@/lib/validation";
import type { OrderStatus } from "@/types/database";

export interface OrderActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Cambia el estado de un pedido.
 *
 * Devuelve estado: antes era `void` y no comprobaba el error de Supabase ni el
 * del backend, así que un cambio rechazado (sesión caducada, pedido de otro
 * negocio) se veía como éxito y el select quedaba mostrando un valor falso.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderActionState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Pedido inválido." };
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Estado inválido." };

  if (backendEnabled()) {
    const res = await backendFetch(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status: parsed.data },
    });
    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 404 ? "El pedido ya no existe." : res.message,
      };
    }
  } else {
    const supabase = await createClient();
    // `select` para distinguir «no se actualizó nada» (pedido inexistente o de
    // otro negocio) de «se actualizó»: el update sin filas no da error.
    const { data, error } = await supabase
      .from("order")
      .update({ status: parsed.data })
      .eq("id", id)
      .eq("business_id", business.id)
      .select("id");
    if (error) {
      console.error("[updateOrderStatus]", error.code, error.message);
      return { ok: false, error: "No se pudo cambiar el estado del pedido." };
    }
    if (!data || data.length === 0) return { ok: false, error: "El pedido ya no existe." };
  }

  revalidatePath("/dashboard/pedidos");
  // La portada cuenta los pedidos por atender y el valor del mes, que excluye
  // los cancelados: cambiar un estado mueve esas cifras.
  revalidatePath("/dashboard");
  return { ok: true, message: "Estado actualizado." };
}
