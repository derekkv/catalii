import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env.js";

/**
 * Cliente con service_role. Salta RLS: úsalo SOLO para tareas de servidor
 * (webhooks, trabajos de fondo). Nunca para datos "del usuario actual".
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseServiceKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/**
 * Cliente que actúa COMO el usuario del token. Al mandar el access token en el
 * header, PostgREST aplica las mismas políticas RLS que en el front, así que el
 * backend no puede ver ni tocar datos de otro negocio por error.
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Cliente anónimo (sin sesión). Para el catálogo público: solo ve lo que las
 * políticas RLS permiten a `anon` (catálogos marcados como públicos).
 */
export function publicClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
