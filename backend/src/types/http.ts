import type { Request } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "@/types/database.js";

/** Datos de sesión que el middleware de auth cuelga de la petición. */
export interface AuthContext {
  userId: string;
  token: string;
  /** Cliente Supabase que actúa como este usuario (RLS aplicada). */
  supabase: SupabaseClient;
}

/** Petición ya autenticada (pasó por `requireAuth`). */
export interface AuthedRequest extends Request {
  auth: AuthContext;
  /** Negocio del usuario; presente solo tras `requireBusiness`. */
  business?: Business;
}
