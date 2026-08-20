import { type NextRequest } from "next/server";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";
import { processEvent } from "@/lib/paddle/process-webhook";
import { createServiceClient } from "@/lib/supabase/server-internal";

/**
 * Webhook de Paddle. Reglas del contrato de entrega:
 *  - Solo un 2xx (< 5s) cuenta como "entregado". Cualquier no-2xx se reintenta.
 *  - El mismo event.eventId llega en cada reintento → dedupe con el ledger.
 *  - Se DEBE verificar la firma con el raw body (nunca con JSON re-serializado).
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? "";

  if (!signature || !rawBody || !secret) {
    return Response.json({ error: "Missing signature, body or secret" }, { status: 400 });
  }

  try {
    const paddle = getPaddleInstance();
    // Lanza si la firma es inválida, el timestamp expiró o el payload es inválido.
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    if (!eventData) {
      return Response.json({ error: "No event" }, { status: 400 });
    }

    // Idempotencia: si ya procesamos este eventId, respondemos 200 sin re-ejecutar.
    const supabase = createServiceClient();
    const { data: seen } = await supabase
      .from("processed_webhook")
      .select("event_id")
      .eq("event_id", eventData.eventId)
      .maybeSingle();

    if (seen) {
      return Response.json({ received: true, deduped: true });
    }

    await processEvent(eventData);

    // Marca como procesado tras el efecto (los handlers son idempotentes de todos modos).
    await supabase.from("processed_webhook").insert({ event_id: eventData.eventId });

    return Response.json({ received: true });
  } catch (e) {
    console.error("[paddle-webhook] error:", e);
    // Cualquier no-2xx hace que Paddle reintente (secreto rotado se recupera solo).
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
