import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPaddleInstance } from "./get-paddle-instance";
import type { PaddleSubscription } from "@/types/database";

/** Estados en los que la suscripción sigue vigente y se puede cancelar/cambiar. */
const LIVE_STATUSES = ["active", "trialing", "past_due"] as const;

/**
 * Suscripción vigente del negocio según la BD (espejo del webhook).
 * Filtra por `business_id`, así que una suscripción que el webhook no pudo
 * enlazar a un negocio (business_id nulo) NO aparece aquí.
 */
export async function getLiveSubscription(
  businessId: string,
): Promise<PaddleSubscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("paddle_subscription")
    .select("*")
    .eq("business_id", businessId)
    .in("status", [...LIVE_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PaddleSubscription | null) ?? null;
}

/**
 * Fecha del próximo cobro, consultada a Paddle (la BD no guarda
 * `next_billed_at`). Devuelve null ante cualquier fallo: es solo informativa.
 */
export async function getNextBilledAt(subscriptionId: string): Promise<string | null> {
  try {
    const sub = await getPaddleInstance().subscriptions.get(subscriptionId);
    return sub.nextBilledAt ?? null;
  } catch {
    return null;
  }
}
