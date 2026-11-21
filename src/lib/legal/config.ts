/**
 * Configuración legal compartida.
 *
 * ÚNICO sitio que hay que rellenar. Las tres páginas públicas y los Markdown de
 * `docs/legal/textos/` leen de aquí, así que al sustituir un `COMPLETAR` por el
 * dato real se actualiza todo.
 *
 * Los textos son breves y solo afirman lo que el código hace de verdad. No son
 * asesoría legal y no pretenden serlo. Por eso aquí solo quedan dos datos
 * (quién responde y dónde escribirle), y nada se inventa: mientras un dato
 * falte, su página lo avisa y no se indexa (ver `hasPendingData` en
 * content.ts).
 */

/** Marcador de dato que falta. Rellenar = reemplazar por el valor real. */
export const COMPLETAR = "JC";

/**
 * Datos del responsable.
 *
 * `brand` y `site` no son datos del dueño: ya se conocen y no se rellenan.
 */
export const COMPANY = {
  brand: "Catalii",
  /** Quién responde del proyecto: tu nombre o el del equipo. */
  owner: "Derek Palacios",
  /** Correo de contacto. Debe existir y estar atendido. */
  contactEmail: "palacios.derek.ismael@gmail.com",
  site: "catalii.com",
} as const;

/** Rutas públicas de los documentos legales. */
export const LEGAL_PATHS = {
  privacy: "/privacidad",
  terms: "/terminos",
  contact: "/contacto",
} as const;

export type LegalDocument = "terms" | "privacy";

/**
 * Versión vigente de cada documento. Se guarda en `legal_acceptance` al
 * aceptar: súbela cada vez que cambie el texto publicado, porque es la prueba
 * de QUÉ aceptó cada usuario.
 */
export const LEGAL_VERSIONS: Record<LegalDocument, string> = {
  terms: "2026-11-21-rev3",
  privacy: "2026-11-21-rev3",
};

/** Moneda en la que se cobran los planes (coincide con `PLAN_CURRENCY`). */
export const BILLING_CURRENCY = "USD";

/**
 * Campos de `COMPANY` que siguen sin rellenar.
 *
 * Hoy no queda ninguno, pero la comprobación se mantiene: si mañana se añade
 * un dato con `COMPLETAR`, su página vuelve a avisar y a no indexarse sola.
 * El `as` ensancha el tipo porque con `as const` TypeScript ya sabe que
 * ninguno de los valores actuales es el marcador.
 */
export function missingLegalData(): string[] {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(COMPANY) as [string, string][]) {
    if (value === (COMPLETAR as string)) missing.push(`COMPANY.${key}`);
  }
  return missing;
}
