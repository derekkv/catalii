import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "@/types/database.js";

/** Datos de sesión que el middleware de auth cuelga de la petición. */
export interface AuthContext {
  userId: string;
  token: string;
  /** Cliente Supabase que actúa como este usuario (RLS aplicada). */
  supabase: SupabaseClient;
}

/**
 * Se aumenta el tipo Request de Express (en vez de una interfaz propia) para
 * que los handlers sigan siendo `Request` normales y Express los acepte. Los
 * campos son opcionales: solo existen tras pasar por requireAuth/requireBusiness.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      business?: Business;
    }
  }
}
