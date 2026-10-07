import "server-only";
import { redirect } from "next/navigation";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { withTimeout, TimeoutError } from "@/lib/timeout";
import type { Business } from "@/types/database";

/** Plazo para verificar la sesión. Algo mayor que el del middleware, que ya
 *  filtra el caso frecuente. */
const AUTH_TIMEOUT_MS = 6000;

/**
 * Error de infraestructura al hablar con Supabase Auth.
 *
 * Se separa de "no hay sesión" a propósito. `getUser()` devuelve usuario nulo
 * en los dos casos, pero significan cosas opuestas:
 *
 *   · Sin sesión            → redirigir a /login es lo correcto.
 *   · Auth inalcanzable     → redirigir a /login le dice al usuario que su
 *                             sesión caducó, lo cual es falso, y lo deja en
 *                             un login que tampoco va a funcionar.
 *
 * Lanzando aquí, el límite de error del panel muestra "algo no cargó bien"
 * con un botón de reintentar, que es la verdad. Y falla cerrado: nunca se
 * devuelve un usuario que no se ha podido verificar.
 */
export class AuthUnavailableError extends Error {
  constructor(cause?: unknown) {
    super(
      "No se pudo verificar la sesión con Supabase Auth. " +
        "Comprueba que el proyecto existe y es alcanzable (NEXT_PUBLIC_SUPABASE_URL).",
    );
    this.name = "AuthUnavailableError";
    this.cause = cause;
  }
}

/**
 * Devuelve el usuario autenticado o null (revalidado contra Auth).
 * Lanza `AuthUnavailableError` si Auth no responde.
 */
export async function getUser() {
  const supabase = await createClient();

  try {
    // Mismo motivo que en el middleware: sin límite, un Auth caído deja la
    // página colgada ~30 s por los reintentos internos de auth-js.
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_TIMEOUT_MS,
      "supabase.auth.getUser",
    );
    // `isAuthRetryableFetchError` es API pública de @supabase/supabase-js:
    // marca los fallos de transporte (DNS, TLS, timeout, 5xx), no los de
    // credenciales.
    if (error && isAuthRetryableFetchError(error)) throw new AuthUnavailableError(error);
    return data.user;
  } catch (error) {
    if (error instanceof AuthUnavailableError) throw error;
    // Plazo agotado o fetch roto a nivel de runtime.
    if (error instanceof TimeoutError) throw new AuthUnavailableError(error);
    throw new AuthUnavailableError(error);
  }
}

/** Carga el negocio de un usuario ya verificado. */
async function loadBusinessFor(userId: string): Promise<Business | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  return (data as Business) ?? null;
}

/** Devuelve el business del usuario actual, o null si aún no creó uno. */
export async function getBusiness(): Promise<Business | null> {
  const user = await getUser();
  if (!user) return null;
  return loadBusinessFor(user.id);
}

/**
 * Exige sesión + business. Redirige a /login si no hay sesión y a
 * /dashboard/onboarding si hay sesión pero aún no hay negocio.
 *
 * No reutiliza `getBusiness()` para no revalidar el token dos veces: cada
 * `auth.getUser()` es una llamada de red al servidor de Auth, y antes se
 * hacían dos en cada carga de página del panel.
 */
export async function requireBusiness(): Promise<Business> {
  const user = await getUser();
  if (!user) redirect("/login");

  const business = await loadBusinessFor(user.id);
  if (!business) redirect("/dashboard/onboarding");
  return business;
}
