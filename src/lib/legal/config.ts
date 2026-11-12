/**
 * Configuración legal compartida: datos de la empresa y de los documentos.
 *
 * ÚNICO sitio que hay que rellenar. Las 6 páginas públicas y los Markdown de
 * `docs/legal/textos/` leen de aquí, así que al sustituir un `COMPLETAR` por el
 * dato real se actualiza todo.
 *
 * Nada se inventa: lo que no se sabe queda marcado y la página correspondiente
 * no se indexa mientras tenga marcadores (ver `hasPendingData` en content.ts).
 * Lista con el detalle de cada campo: `docs/legal/DATOS-PENDIENTES.md`.
 */

/** Marcador de dato que falta. Rellenar = reemplazar por el valor real. */
export const COMPLETAR = "[COMPLETAR]";

/** Marcador de decisión jurídica: no la rellenes sin tu abogado. */
export const ABOGADO = "[PREGUNTAR A ABOGADO]";

export const COMPANY = {
  brand: "Catalii",
  legalName: COMPLETAR, // razón social
  taxId: COMPLETAR, // identificación fiscal
  address: COMPLETAR, // domicilio
  country: COMPLETAR, // país de la empresa
  contactEmail: COMPLETAR, // correo general de contacto
  privacyEmail: COMPLETAR, // correo para ejercer derechos sobre datos
  copyrightEmail: COMPLETAR, // correo para reclamos de derechos de autor
  site: "catalii.com",
} as const;

/**
 * Datos que aparecen dentro de los textos. Agrupados por documento.
 *
 * Los `ABOGADO` son decisiones jurídicas, no datos operativos: cámbialos solo
 * con la respuesta de tu abogado (ver docs/legal/RESUMEN_ABOGADO.md).
 */
export const LEGAL_DATA = {
  // ── Privacidad ────────────────────────────────────────────────────────────
  /** Retención de los registros de conexión del alojamiento (IP, navegador). */
  retentionServerLogs: COMPLETAR,
  /** Cuánto se conserva la cuenta y los datos del negocio. */
  retentionAccount: COMPLETAR,
  /** Cuánto se conservan los pedidos y los datos de compradores. */
  retentionOrders: COMPLETAR,
  /** Cuánto se conservan los datos de suscripción y facturación. */
  retentionBilling: COMPLETAR,
  /** Cuánto se conservan los registros técnicos propios. */
  retentionTechnical: COMPLETAR,
  /** Ciclo de las copias de seguridad. */
  retentionBackups: COMPLETAR,
  /** Plazo para responder a una solicitud sobre datos. */
  rightsResponseTime: COMPLETAR,
  /** Autoridad de protección de datos ante la que se puede reclamar. */
  dataAuthority: COMPLETAR,
  /** Cómo se avisará a los usuarios registrados de un cambio de política. */
  privacyChangeNotice: COMPLETAR,

  // ── Términos ──────────────────────────────────────────────────────────────
  /** Si los precios mostrados llevan impuestos incluidos. */
  taxesIncluded: COMPLETAR,
  /** Qué pasa con el plan y los datos al cancelar o dejar de pagar. */
  cancelConsequences: COMPLETAR,
  /** Rubros o sectores que no se admiten en los catálogos. */
  restrictedCategories: COMPLETAR,
  /** Cómo se avisará de cambios importantes en los términos. */
  termsChangeNotice: COMPLETAR,
  /** Ley aplicable al contrato. */
  governingLaw: COMPLETAR,
  /** Tribunales o mecanismo de resolución de disputas. */
  jurisdiction: COMPLETAR,

  // ── Reembolsos ────────────────────────────────────────────────────────────
  /** Quién puede pedir un reembolso y en qué supuestos. */
  refundEligibility: COMPLETAR,
  /** Si el reembolso lo gestiona Paddle o la empresa. */
  refundHandler: COMPLETAR,
  /** Plazo máximo para solicitar un reembolso. */
  refundRequestWindow: COMPLETAR,
  /** Plazo de respuesta y de devolución del dinero. */
  refundResponseTime: COMPLETAR,
  /** Si se reembolsa el periodo ya pagado al cancelar. */
  refundAfterCancel: COMPLETAR,

  // ── Derechos de autor ─────────────────────────────────────────────────────
  /** Plazo para acusar recibo de un reclamo. */
  copyrightAckTime: COMPLETAR,
  /** Plazos y condiciones del procedimiento de retirada/restablecimiento. */
  copyrightProcessTimes: COMPLETAR,

  // ── Proveedores ───────────────────────────────────────────────────────────
  /** Región del proyecto de Supabase (p. ej. "us-east-1"). */
  regionSupabase: COMPLETAR,
  /** Región/es de Cloudflare Workers. */
  regionWorkers: COMPLETAR,
  /** Región de los buckets de Cloudflare R2. */
  regionR2: COMPLETAR,
  /** País de Paddle y su rol frente al cliente final. */
  regionPaddle: COMPLETAR,
  /** Estado de los contratos de tratamiento de datos (DPA) firmados. */
  dpaStatus: COMPLETAR,

  // ── Contacto ──────────────────────────────────────────────────────────────
  /** Tiempo de respuesta del canal de contacto. */
  supportResponseTime: COMPLETAR,
} as const;

/** Rutas públicas de los documentos legales. */
export const LEGAL_PATHS = {
  privacy: "/privacidad",
  terms: "/terminos",
  refunds: "/reembolsos",
  copyright: "/derechos-de-autor",
  providers: "/proveedores",
  contact: "/contacto",
} as const;

export type LegalDocument = "terms" | "privacy";

/**
 * Versión vigente de cada documento. Se guarda en `legal_acceptance` al
 * aceptar: súbela cada vez que cambie el texto publicado, porque es la prueba
 * de QUÉ aceptó cada usuario.
 */
export const LEGAL_VERSIONS: Record<LegalDocument, string> = {
  terms: "2026-11-12",
  privacy: "2026-11-12",
};

/** Moneda en la que se cobran los planes (coincide con `PLAN_CURRENCY`). */
export const BILLING_CURRENCY = "USD";

/** Campos de `COMPANY` y `LEGAL_DATA` que siguen sin rellenar. */
export function missingLegalData(): string[] {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(COMPANY)) {
    if (value === COMPLETAR) missing.push(`COMPANY.${key}`);
  }
  for (const [key, value] of Object.entries(LEGAL_DATA)) {
    if (value === COMPLETAR) missing.push(`LEGAL_DATA.${key}`);
  }
  return missing;
}
