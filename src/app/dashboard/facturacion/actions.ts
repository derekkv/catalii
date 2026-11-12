"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";
import { getLiveSubscription } from "@/lib/paddle/subscription";
import { PLANS } from "@/lib/plans";
import type { PlanTier } from "@/types/database";

export type BillingActionState = { ok: true; message: string } | { ok: false; error: string };

const GENERIC_ERROR =
  "No pudimos completar la operación con el proveedor de pagos. Inténtalo de nuevo en unos minutos; si persiste, contáctanos.";

/**
 * Cancela la suscripción vigente del negocio al final del periodo ya pagado.
 * No toca el plan en local: el webhook (subscription.updated/canceled) lo
 * sincroniza.
 */
export async function cancelSubscriptionAction(): Promise<BillingActionState> {
  const business = await requireBusiness();
  const sub = await getLiveSubscription(business.id);
  if (!sub) {
    return { ok: false, error: "No encontramos una suscripción activa en tu cuenta." };
  }
  if (sub.scheduled_change_at) {
    return { ok: false, error: "Tu suscripción ya tiene un cambio programado." };
  }

  try {
    await getPaddleInstance().subscriptions.cancel(sub.subscription_id, {
      effectiveFrom: "next_billing_period",
    });
  } catch (error) {
    console.error("[billing] cancel failed", error instanceof Error ? error.message : error);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/dashboard/facturacion");
  return {
    ok: true,
    message:
      "Cancelación programada. Conservas tu plan hasta el final del periodo ya pagado. Puede tardar unos segundos en reflejarse aquí.",
  };
}

/**
 * Cambia el plan de la suscripción vigente (sin abrir un checkout nuevo, que
 * crearía una segunda suscripción). El `priceId` se resuelve en el servidor a
 * partir de PLANS; el cliente solo envía el tier.
 */
export async function changePlanAction(tier: PlanTier): Promise<BillingActionState> {
  const business = await requireBusiness();

  const plan = tier === "starter" || tier === "pro" || tier === "business" ? PLANS[tier] : null;
  const priceId = plan?.paddlePriceId;
  if (!plan || !priceId) {
    return { ok: false, error: "Ese plan no está disponible para contratar." };
  }

  const sub = await getLiveSubscription(business.id);
  if (!sub) {
    return { ok: false, error: "No encontramos una suscripción activa en tu cuenta." };
  }
  if (sub.price_id === priceId) {
    return { ok: false, error: "Ya tienes ese plan." };
  }
  if (sub.scheduled_change_at) {
    return {
      ok: false,
      error: "Tu suscripción tiene un cambio programado; espera a que se aplique antes de cambiar de plan.",
    };
  }

  try {
    await getPaddleInstance().subscriptions.update(sub.subscription_id, {
      items: [{ priceId, quantity: 1 }],
      prorationBillingMode: "prorated_next_billing_period",
    });
  } catch (error) {
    console.error("[billing] change plan failed", error instanceof Error ? error.message : error);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/dashboard/facturacion");
  return {
    ok: true,
    message: `Cambio a ${plan.name} solicitado. Puede tardar unos segundos en reflejarse aquí.`,
  };
}
