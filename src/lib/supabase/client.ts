import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para componentes de cliente (navegador).
 * Usa la clave publicable/anon — segura de exponer. RLS protege los datos.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example)",
    );
  }
  return createBrowserClient(url, key);
}
