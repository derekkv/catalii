"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export interface AuthState {
  ok: boolean;
  error?: string;
  info?: string;
}

const emailSchema = z.string().trim().toLowerCase().email().max(160);
const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(72);

/** Solo permite rutas internas relativas (evita open-redirect). */
function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "/dashboard";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = z.string().min(1).safeParse(formData.get("password"));
  if (!email.success) return { ok: false, error: "Ingresa un correo válido." };
  if (!password.success) return { ok: false, error: "Ingresa tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });
  if (error) {
    console.error("[signIn] Supabase error:", error.status, error.message);
    if (error.message.toLowerCase().includes("not confirmed")) {
      return { ok: false, error: "Confirma tu correo antes de entrar. Revisa tu bandeja." };
    }
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirm = String(formData.get("confirm") ?? "");

  if (!email.success) return { ok: false, error: "Ingresa un correo válido." };
  if (!password.success) return { ok: false, error: password.error.issues[0]?.message };
  if (password.data !== confirm) return { ok: false, error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      data: { full_name: name || null },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("[signUp] Supabase error:", error.status, error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión." };
    }
    if (msg.includes("weak") || msg.includes("password")) {
      return { ok: false, error: "La contraseña es muy débil. Usa al menos 8 caracteres." };
    }
    if (msg.includes("signups not allowed") || msg.includes("disabled")) {
      return { ok: false, error: "Los registros están deshabilitados en Supabase (Authentication → Providers → Email)." };
    }
    if (msg.includes("rate limit") || msg.includes("too many") || error.status === 429) {
      return { ok: false, error: "Demasiados intentos seguidos. Espera unos minutos, o desactiva la confirmación de email en Supabase (Authentication → Providers → Email → Confirm email OFF)." };
    }
    if (msg.includes("sending") || msg.includes("smtp") || msg.includes("email")) {
      return { ok: false, error: "Error al enviar el correo de confirmación. Desactiva 'Confirm email' en Supabase o configura un SMTP propio." };
    }
    if (msg.includes("fetch") || msg.includes("network") || error.status === 0) {
      return { ok: false, error: "No hay conexión con Supabase. Verifica NEXT_PUBLIC_SUPABASE_URL / ANON_KEY." };
    }
    // Muestra la causa real (útil en desarrollo)
    return { ok: false, error: `No se pudo crear la cuenta: ${error.message}` };
  }

  // Si el proyecto no exige confirmación de email, ya hay sesión → entrar.
  if (data.session) redirect(next);

  return { ok: true, info: "Te enviamos un correo para confirmar tu cuenta. Ábrelo para continuar." };
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { ok: false, error: "Ingresa un correo válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/auth/reset`,
  });

  // Respuesta neutral (no revela si el correo existe).
  return { ok: true, info: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña." };
}
