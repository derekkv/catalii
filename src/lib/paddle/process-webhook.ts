import "server-only";
import {
  type EventEntity,
  EventName,
  type CustomerCreatedEvent,
  type CustomerUpdatedEvent,
  type SubscriptionCreatedEvent,
  type SubscriptionUpdatedEvent,
  type SubscriptionCanceledEvent,
} from "@paddle/paddle-node-sdk";
import { createServiceClient } from "@/lib/supabase/server-internal";
import { planFromPaddleProduct } from "@/lib/plans";
import type { PlanTier } from "@/types/database";

type SubEvent =
  | SubscriptionCreatedEvent
  | SubscriptionUpdatedEvent
  | SubscriptionCanceledEvent;

/**
 * Enruta y procesa eventos verificados de Paddle. Todos los handlers son
 * IDEMPOTENTES (UPSERT por id de recurso de Paddle) porque Paddle entrega
 * "at-least-once": el mismo evento puede llegar varias veces.
 */
export async function processEvent(event: EventEntity) {
  switch (event.eventType) {
    case EventName.CustomerCreated:
    case EventName.CustomerUpdated:
      return upsertCustomer(event);
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
      return upsertSubscription(event);
    default:
      return; // eventos no manejados: no-op
  }
}

async function upsertCustomer(event: CustomerCreatedEvent | CustomerUpdatedEvent) {
  const supabase = createServiceClient();
  const email = event.data.email;

  // Enlaza el customer de Paddle con el business del usuario por email.
  let businessId: string | null = null;
  if (email) {
    const { data: biz } = await supabase
      .from("business")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    businessId = biz?.id ?? null;
  }

  const { error } = await supabase.from("paddle_customer").upsert(
    {
      customer_id: event.data.id,
      email: email ?? "",
      business_id: businessId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_id" },
  );
  if (error) throw error;
}

async function upsertSubscription(event: SubEvent) {
  const supabase = createServiceClient();
  const sub = event.data;
  const priceId = sub.items[0]?.price?.id ?? null;
  const productId = sub.items[0]?.price?.productId ?? null;

  // Resuelve el business a partir del customer espejado.
  const { data: cust } = await supabase
    .from("paddle_customer")
    .select("business_id")
    .eq("customer_id", sub.customerId)
    .maybeSingle();
  const businessId = cust?.business_id ?? null;

  const { error } = await supabase.from("paddle_subscription").upsert(
    {
      subscription_id: sub.id,
      customer_id: sub.customerId,
      business_id: businessId,
      status: sub.status,
      price_id: priceId,
      product_id: productId,
      scheduled_change_at: sub.scheduledChange?.effectiveAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "subscription_id" },
  );
  if (error) throw error;

  // Actualiza el plan del business según estado + producto de Paddle.
  if (businessId) {
    const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
    const tier: PlanTier = active ? planFromPaddleProduct(productId) ?? "free" : "free";
    await supabase.from("business").update({ plan: tier }).eq("id", businessId);
  }
}
