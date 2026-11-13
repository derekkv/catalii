/**
 * Configuración legal compartida.
 *
 * ÚNICO sitio que hay que rellenar. Las tres páginas públicas y los Markdown de
 * `docs/legal/textos/` leen de aquí, así que al sustituir un `COMPLETAR` por el
 * dato real se actualiza todo.
 *
 * Catalii es un proyecto escolar, no un servicio comercial: los textos son
 * breves y solo afirman lo que el código hace de verdad. No son asesoría legal
 * y no pretenden serlo. Por eso aquí solo quedan tres datos (quién lo hace,
 * dónde escribirle y en qué contexto académico), y nada se inventa: mientras un
 * dato falte, su página lo avisa y no se indexa (ver `hasPendingData` en
 * content.ts).
 */

/** Marcador de dato que falta. Rellenar = reemplazar por el valor real. */
export const COMPLETAR = "[COMPLETAR]";

/**
 * Los tres únicos datos pendientes.
 *
 * `brand` y `site` no son datos del dueño: ya se conocen y no se rellenan.
 */
export const COMPANY = {
  brand: "Catalii",
  /** Quién responde del proyecto: tu nombre o el del equipo. */
  owner: COMPLETAR,
  /** Correo de contacto. Debe existir y estar atendido. */
  contactEmail: COMPLETAR,
  /** Institución o materia en la que se presenta el proyecto. */
  institution: COMPLETAR,
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
  terms: "2026-11-12-rev2",
  privacy: "2026-11-12-rev2",
};

/** Moneda en la que se cobran los planes (coincide con `PLAN_CURRENCY`). */
export const BILLING_CURRENCY = "USD";

/**
 * Aviso de proyecto académico. Se muestra arriba en las tres páginas legales y
 * es lo más importante que dicen: explica el contexto real en lugar de prometer
 * garantías que un trabajo de clase no puede dar.
 *
 * Vive aquí, y no en `content.ts`, porque también lo usan componentes de
 * cliente que ya importan este archivo (el formulario del comprador).
 */
export const ACADEMIC_NOTICE = [
  `${COMPANY.brand} es un proyecto escolar en desarrollo, no un servicio comercial.`,
  "Los planes de pago y el checkout están en modo de pruebas: no se cobra dinero real.",
  "No subas datos reales de clientes ni información que no quieras compartir.",
] as const;

/** Versión en una línea, para avisos cortos dentro de la app. */
export const ACADEMIC_NOTICE_SHORT = `${COMPANY.brand} es un proyecto escolar en modo de pruebas: no envíes datos reales que no quieras compartir.`;

/** Campos de `COMPANY` que siguen sin rellenar. */
export function missingLegalData(): string[] {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(COMPANY)) {
    if (value === COMPLETAR) missing.push(`COMPANY.${key}`);
  }
  return missing;
}
