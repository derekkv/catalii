import "server-only";
import { createServiceClient } from "@/lib/supabase/server-internal";
import { LEGAL_VERSIONS, type LegalDocument } from "./config";
import type { LegalAcceptanceMethod } from "@/types/database";

const DOCUMENTS: LegalDocument[] = ["terms", "privacy"];

/**
 * Registra la aceptación de Términos y Privacidad (versiones vigentes).
 *
 * Decisión: si el insert falla se LOGUEA en servidor y NO se lanza error. La
 * cuenta ya existe en Supabase Auth; bloquear el alta aquí dejaría una cuenta
 * creada pero reportada como fallida. Es idempotente (upsert sobre
 * user_id+document+version). No guarda IP ni user agent.
 *
 * Devuelve true si quedó registrada.
 */
export async function recordLegalAcceptance(
  userId: string,
  method: LegalAcceptanceMethod,
): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const rows = DOCUMENTS.map((document) => ({
      user_id: userId,
      document,
      version: LEGAL_VERSIONS[document],
      method,
    }));
    const { error } = await supabase
      .from("legal_acceptance")
      .upsert(rows, { onConflict: "user_id,document,version", ignoreDuplicates: true });
    if (error) {
      console.error("[legal_acceptance] No se pudo registrar la aceptación:", error.code, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[legal_acceptance] Error inesperado al registrar la aceptación:", err);
    return false;
  }
}
