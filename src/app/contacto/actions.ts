"use server";

import { createServiceClient } from "@/lib/supabase/server-internal";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "./contact-schema";

export type ContactState = {
  ok: boolean;
  /** Mensaje de error para mostrar debajo del formulario. */
  error?: string;
};

/**
 * Cuántos mensajes admite un mismo correo por hora.
 *
 * No hay límite por IP porque la petición llega desde el Worker y la IP que
 * vería el servidor es la de Cloudflare, no la de la persona. Limitar por
 * correo es lo que se puede hacer con lo que de verdad se guarda.
 */
const MAX_PER_HOUR = 5;

/**
 * Guarda un mensaje del formulario de contacto.
 *
 * Escribe con `service_role` a propósito: la tabla no da ningún permiso a
 * `anon`, así que un visitante no puede leer ni contar los mensajes de otros,
 * solo provocar este insert controlado.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Señuelo: un campo invisible para la persona que los bots sí rellenan. Se
  // responde "ok" sin guardar nada, para no enseñarle al bot qué lo delató.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: true };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { name, email, subject, message } = parsed.data;

  try {
    // Si hay sesión, el mensaje queda vinculado a la cuenta. Sin sesión
    // también se acepta: la página de contacto es pública.
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;

    const service = createServiceClient();

    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await service
      .from("contact_message")
      .select("id", { count: "exact", head: true })
      .eq("sender_email", email)
      .gte("created_at", sinceIso);

    if (countError) throw countError;

    if ((count ?? 0) >= MAX_PER_HOUR) {
      return {
        ok: false,
        error: "Ya enviaste varios mensajes seguidos. Espera un rato antes de escribir otro.",
      };
    }

    const { error } = await service.from("contact_message").insert({
      sender_name: name,
      sender_email: email,
      subject,
      message,
      user_id: userId,
    });

    if (error) throw error;

    return { ok: true };
  } catch (err) {
    // El detalle va al log del servidor; a la persona no se le cuenta nada de
    // la base de datos.
    console.error(
      "[sendContactMessage]",
      err instanceof Error ? `${err.name}: ${err.message}` : "error desconocido",
    );
    return {
      ok: false,
      error: "No se pudo enviar el mensaje. Inténtalo de nuevo en un momento.",
    };
  }
}
