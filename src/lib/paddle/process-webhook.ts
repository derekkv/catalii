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

  // Cuenta borrada por el usuario: su fila se conserva con el correo vaciado
  // (ver "Borrar mi cuenta"). Un customer.updated posterior no debe volver a
  // escribir el correo ni reenlazar el negocio.
  const { data: existing } = await supabase
    .from("paddle_customer")
    .select("email")
    .eq("customer_id", event.data.id)
    .maybeSingle();
  if (existing && existing.email === "") return;

  // Enlaza el customer de Paddle con el business del usuario por email.
  //
  // `business.email` no es único (es opcional y lo edita el usuario), así que
  // dos negocios pueden compartir correo. En ese caso `maybeSingle()` devuelve
  // error y antes se ignoraba: `business_id` quedaba en null, el plan no se
  // actualizaba y nadie se enteraba. Ahora se registra, porque es un fallo que
  // solo se puede resolver a mano decidiendo a qué negocio pertenece el pago.
  let businessId: string | null = null;
  if (email) {
    const { data: biz, error: bizError } = await supabase
      .from("business")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (bizError) {
      console.error(
        "[paddle:upsertCustomer] no se pudo resolver el negocio por correo",
        { customerId: event.data.id, code: bizError.code, message: bizError.message },
      );
    }
    businessId = biz?.id ?? null;
  }

  if (email && !businessId) {
    // No es necesariamente un error: puede ser un cliente de Paddle que aún no
    // tiene negocio creado. Pero si había suscripción, el plan se queda sin
    // aplicar, así que conviene que quede rastro.
    console.warn("[paddle:upsertCustomer] cliente sin negocio asociado", {
      customerId: event.data.id,
    });
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
  const { data: cust, error: custError } = await supabase
    .from("paddle_customer")
    .select("business_id")
    .eq("customer_id", sub.customerId)
    .maybeSingle();
  if (custError) {
    console.error("[paddle:upsertSubscription] no se pudo leer el cliente espejado", {
      subscriptionId: sub.id,
      customerId: sub.customerId,
      code: custError.code,
      message: custError.message,
    });
  }
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
    const { error: planError } = await supabase
      .from("business")
      .update({ plan: tier })
      .eq("id", businessId);
    // Se registra en vez de lanzar: la suscripción ya quedó espejada arriba, y
    // lanzar haría que Paddle reintentara el evento entero. Si esto falla, el
    // usuario pagó y no tiene su plan, así que tiene que quedar rastro.
    if (planError) {
      console.error("[paddle:upsertSubscription] no se pudo aplicar el plan", {
        subscriptionId: sub.id,
        businessId,
        tier,
        code: planError.code,
        message: planError.message,
      });
    }
  } else {
    // Suscripción sin negocio: el cobro existe pero el plan no se aplica a
    // nadie. Pasa si el correo de Paddle no coincide con el del negocio.
    console.error("[paddle:upsertSubscription] suscripcion sin negocio asociado", {
      subscriptionId: sub.id,
      customerId: sub.customerId,
      status: sub.status,
    });
  }
}
