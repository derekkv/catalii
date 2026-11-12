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
    return { ok: false, error: "No se pudo enviar el pedido. Verifica los datos e intenta de nuevo." };
  }

  const result = data as { order_id: string; total_cents: number; currency: string };
  return {
    ok: true,
    orderId: result.order_id,
    totalCents: result.total_cents,
    currency: result.currency,
  };
}
