import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con SERVICE ROLE — BYPASSEA RLS.
 *
 * ⚠️ Uso EXCLUSIVO en código de servidor de confianza (webhook de Paddle).
 * NUNCA importar en componentes de cliente ni exponer la clave al navegador.
 * El import "server-only" hace fallar el build si se filtra al cliente.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
