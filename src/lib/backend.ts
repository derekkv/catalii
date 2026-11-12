import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Cliente del backend Express (`backend/`). Solo se usa desde el servidor
 * (Server Actions, Server Components, Route Handlers): el token de sesión nunca
 * pasa por JavaScript del navegador.
 *
 * Migración incremental: si `BACKEND_URL` no está definida, `backendEnabled()`
 * es false y cada acción sigue usando su camino anterior (Supabase directo).
 * Así se puede desplegar el front sin tener el backend arriba, y activarlo por
 * entorno cuando esté listo.
 */

const TIMEOUT_MS = 10_000;

export function backendEnabled(): boolean {
  return Boolean(process.env.BACKEND_URL);
}

export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** false para rutas públicas (storefront, enviar pedido): no manda token. */
  auth?: boolean;
}

function fail(
  status: number,
  code: string,
  message: string,
): BackendResult<never> {
  return { ok: false, status, code, message };
}

/**
 * Llama al backend y devuelve un resultado tipado en vez de lanzar, para que
 * las acciones puedan mostrar `message` (ya en español) directamente.
 *
 * El access token se toma de la sesión de Supabase y el backend lo revalida
 * contra Auth en cada petición; aquí no se confía en él.
 */
export async function backendFetch<T>(
  path: string,
  { method = "GET", body, auth = true }: Options = {},
): Promise<BackendResult<T>> {
  const base = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!base)
    return fail(503, "unavailable", "El servicio no está configurado.");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token)
      return fail(
        401,
        "unauthorized",
        "Tu sesión expiró. Vuelve a iniciar sesión.",
      );
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Caído, DNS, CORS de red o plazo agotado.
    return fail(
      503,
      "unavailable",
      "El servicio no responde. Intenta de nuevo en un momento.",
    );
  }

  let json: { data?: T; error?: { code?: string; message?: string } } | null =
    null;
  try {
    json = await res.json();
  } catch {
    // Cuerpo vacío o no JSON (p. ej. un 502 de un proxy).
  }

  if (!res.ok) {
    return fail(
      res.status,
      json?.error?.code ?? "error",
      json?.error?.message ?? "No se pudo completar la operación.",
    );
  }
  return { ok: true, data: json?.data as T };
}
