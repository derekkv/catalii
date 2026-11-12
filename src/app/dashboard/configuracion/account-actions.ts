"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server-internal";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";
import { deleteMedia } from "@/lib/media/server";

export interface DeleteAccountState {
  ok: boolean;
  error?: string;
}

/** Estados de suscripción de Paddle que aún pueden generar cobros. */
const LIVE_SUB_STATUSES = ["active", "trialing", "past_due", "paused"];

function isNotFound(err: unknown): boolean {
  const e = err as { code?: string; statusCode?: number; status?: number } | null;
  return e?.statusCode === 404 || e?.status === 404 || e?.code === "not_found";
}

/**
 * Borra la cuenta del usuario AUTENTICADO ACTUAL (nunca recibe un id por
 * parámetro). Orden:
 *   1. Cancela en Paddle las suscripciones vivas, de inmediato. Si falla, se
 *      ABORTA sin borrar nada: una cuenta borrada con cobros activos es peor.
 *   2. Borra objetos de R2 (best-effort; huérfanos se loguean).
 *   3. Vacía el email en paddle_customer (la fila se conserva: ver README).
 *   4. Borra el usuario en Supabase Auth (cascada al resto de la BD).
 *   5. Cierra sesión y redirige a la landing.
 *
 * Idempotente: cada paso tolera haberse ejecutado ya (suscripción cancelada,
 * objetos ya borrados, email ya vacío, usuario ya inexistente). Reintentar tras
 * un fallo parcial continúa donde se quedó.
 */
export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Sin sesión: o ya se borró (reintento) o caducó. Nada que hacer.
  if (!user) redirect("/");

  // Confirmación fuerte: el correo exacto de la cuenta, o la palabra BORRAR.
  const typed = String(formData.get("confirmation") ?? "").trim();
  const emailOk = !!user.email && typed.toLowerCase() === user.email.toLowerCase();
  if (!emailOk && typed !== "BORRAR") {
    return { ok: false, error: "La confirmación no coincide. Escribe tu correo o BORRAR." };
  }

  // Lecturas con la sesión del usuario (RLS): solo ve lo suyo.
  const { data: business } = await supabase
    .from("business")
    .select("id, logo_key, banner_key")
    .eq("owner_id", user.id)
    .maybeSingle();

  // 1) Paddle ────────────────────────────────────────────────────────────
  if (business) {
    const { data: subs, error: subsError } = await supabase
      .from("paddle_subscription")
      .select("subscription_id, status")
      .eq("business_id", business.id);
    if (subsError) {
      console.error("[deleteAccount] leer suscripciones:", subsError.message);
      return { ok: false, error: "No se pudo comprobar tu suscripción. No se borró nada; inténtalo de nuevo." };
    }

    const live = (subs ?? []).filter((s) => LIVE_SUB_STATUSES.includes(s.status as string));
    if (live.length > 0) {
      let paddle: ReturnType<typeof getPaddleInstance>;
      try {
        paddle = getPaddleInstance();
      } catch (err) {
        console.error("[deleteAccount] Paddle no configurado:", err);
        return { ok: false, error: "No se pudo contactar al proveedor de pagos para cancelar tu suscripción. No se borró nada; contacta a soporte." };
      }
      for (const s of live) {
        const id = s.subscription_id as string;
        try {
          // El estado local puede estar desfasado: se consulta a Paddle.
          const remote = await paddle.subscriptions.get(id);
          if (remote.status !== "canceled") {
            await paddle.subscriptions.cancel(id, { effectiveFrom: "immediately" });
          }
        } catch (err) {
          if (isNotFound(err)) continue;
          console.error("[deleteAccount] cancelar suscripción", id, err);
          return {
            ok: false,
            error: "No se pudo cancelar tu suscripción en Paddle. No se borró nada para evitar cobros futuros; inténtalo de nuevo o contacta a soporte.",
          };
        }
      }
    }
  }

  // 2) Objetos R2 ────────────────────────────────────────────────────────
  if (business) {
    const keys = new Set<string>();
    const add = (k: unknown) => {
      if (typeof k === "string" && k) keys.add(k);
    };
    add(business.logo_key);
    add(business.banner_key);

    const { data: cats } = await supabase
      .from("catalog")
      .select("logo_key, banner_key")
      .eq("business_id", business.id);
    for (const c of cats ?? []) {
      add(c.logo_key);
      add(c.banner_key);
    }

    // Paginado: PostgREST limita las respuestas a 1000 filas.
    for (let from = 0; ; from += 1000) {
      const { data: prods, error } = await supabase
        .from("product")
        .select("id, images")
        .eq("business_id", business.id)
        .order("id", { ascending: true })
        .range(from, from + 999);
      if (error) {
        console.error("[deleteAccount] leer productos:", error.message);
        break; // best-effort: se continúa; las imágenes no listadas quedarían huérfanas
      }
      for (const p of prods ?? []) {
        if (Array.isArray(p.images)) {
          for (const img of p.images as Array<{ key?: unknown }>) add(img?.key);
        }
      }
      if (!prods || prods.length < 1000) break;
    }

    await deleteMedia([...keys]); // nunca lanza
  }

  // 3) paddle_customer: vaciar email ──────────────────────────────────────
  const admin = createServiceClient();
  if (business) {
    const { error } = await admin.from("paddle_customer").update({ email: "" }).eq("business_id", business.id);
    if (error) console.error("[deleteAccount] vaciar email paddle_customer (business):", error.message);
  }
  if (user.email) {
    const { error } = await admin.from("paddle_customer").update({ email: "" }).eq("email", user.email);
    if (error) console.error("[deleteAccount] vaciar email paddle_customer (email):", error.message);
  }

  // 4) Usuario de Auth (cascada) ──────────────────────────────────────────
  const { error: delError } = await admin.auth.admin.deleteUser(user.id);
  if (delError && !/not.?found/i.test(delError.message) && delError.status !== 404) {
    console.error("[deleteAccount] deleteUser:", delError.status, delError.message);
    return {
      ok: false,
      error: "Se cancelaron tus pagos y se borraron tus imágenes, pero no se pudo eliminar la cuenta. Vuelve a intentarlo: es seguro repetir la operación.",
    };
  }

  // 5) Cerrar sesión y salir ───────────────────────────────────────────────
  try {
    await supabase.auth.signOut();
  } catch {
    // La sesión ya no es válida al no existir el usuario; solo se limpian cookies.
  }
  redirect("/");
}
