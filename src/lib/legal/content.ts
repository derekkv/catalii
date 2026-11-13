/**
 * Contenido legal — fuente única.
 *
 * Las páginas públicas (src/app/<doc>/page.tsx) y los Markdown de
 * docs/legal/textos/ salen de este archivo. Los datos concretos NO se escriben
 * aquí: viven en `./config` (COMPANY), que es el único sitio que hay que
 * rellenar. Lo que no se sabe queda marcado como [COMPLETAR].
 *
 * Criterio de redacción: Catalii es un proyecto escolar, así que estos textos
 * son cortos y solo dicen cosas comprobables en el código (qué se guarda, en
 * qué servicios, qué queda en el navegador, cómo descargar o borrar la cuenta).
 * No afirman cumplimiento normativo, no citan leyes ni plazos legales y no
 * sustituyen a asesoría profesional. Si algo no se puede afirmar, no se escribe.
 */
import { BILLING_CURRENCY, COMPANY, COMPLETAR, LEGAL_PATHS, LEGAL_VERSIONS } from "./config";

export { ACADEMIC_NOTICE, ACADEMIC_NOTICE_SHORT } from "./config";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export type LegalDoc = {
  slug: "privacy" | "terms" | "contact";
  path: string;
  /** Nombre del archivo en docs/legal/textos/ (sin extensión). */
  file: string;
  title: string;
  description: string;
  version: string;
  sections: LegalSection[];
};

const p = (text: string): LegalBlock => ({ type: "p", text });
const ul = (...items: string[]): LegalBlock => ({ type: "ul", items });

const BRAND = COMPANY.brand;

/**
 * Aviso de proyecto académico. Se muestra arriba en las tres páginas y es lo
 * más importante que dicen: explica el contexto real en lugar de prometer
 * garantías que un trabajo de clase no puede dar. Vive en `./config` porque lo
 * comparten páginas legales y componentes de cliente.
 */

/* ── Privacidad ─────────────────────────────────────────────────────────── */
const privacy: LegalDoc = {
  slug: "privacy",
  path: LEGAL_PATHS.privacy,
  file: "privacidad",
  title: "Privacidad",
  description: `Qué datos guarda ${BRAND}, dónde quedan y cómo borrarlos.`,
  version: LEGAL_VERSIONS.privacy,
  sections: [
    {
      id: "quien",
      title: "1. Quién está detrás",
      blocks: [
        p(
          `${BRAND} es un proyecto escolar hecho por ${COMPANY.owner} para ${COMPANY.institution}. Sirve para que un mayorista publique un catálogo con enlace propio y reciba pedidos.`,
        ),
        p(`Para cualquier cosa sobre tus datos, escribe a ${COMPANY.contactEmail}.`),
      ],
    },
    {
      id: "datos",
      title: "2. Qué datos se guardan",
      blocks: [
        p("Si creas una cuenta (vendedor):"),
        ul(
          "Correo y contraseña. La contraseña la gestiona el servicio de autenticación; no se ve en claro.",
          "Nombre, si lo escribes (opcional).",
          "Datos del negocio: nombre, enlace público, apariencia, WhatsApp y correo de contacto (opcionales).",
          "Lo que subes o creas: logo, banner, fotos, productos, precios y catálogos.",
          "Datos de suscripción de prueba: identificadores, estado y plan. Los datos de tarjeta los recoge Paddle; aquí no se guardan.",
        ),
        p("Si envías un pedido desde un catálogo (comprador):"),
        ul(
          "Nombre y número de WhatsApp (obligatorios para enviar el pedido).",
          "Correo, si lo escribes (opcional).",
          "Notas del pedido: es texto libre, así que no escribas ahí nada que no quieras compartir.",
          "Las líneas del pedido: productos, cantidades y precios.",
        ),
      ],
    },
    {
      id: "uso",
      title: "3. Para qué se usan",
      blocks: [
        ul(
          "Crear tu cuenta, iniciar sesión y recuperar la contraseña.",
          "Mostrar los catálogos públicos y guardar los pedidos que reciben.",
          "Que el vendedor pueda responder al comprador sobre su pedido.",
          "Gestionar la suscripción de prueba de los planes de pago.",
        ),
        p(
          "No hay publicidad, ni analítica, ni píxeles de terceros, y los datos no se venden a nadie.",
        ),
      ],
    },
    {
      id: "navegador",
      title: "4. Qué queda en tu navegador",
      blocks: [
        ul(
          "Cookie de sesión (empieza por sb-…-auth-token): mantiene tu sesión si has iniciado sesión.",
          "catalii-theme: recuerda la apariencia que elegiste.",
          "catalii-cart:<catálogo>: conserva el carrito en ese dispositivo.",
          "catalii-buyer: guarda nombre, teléfono y correo del comprador solo si marca «Recordar mis datos en este dispositivo». Si no la marca, no se guarda y se borra lo que hubiera.",
          "catalii-dev-notice-dismissed: recuerda que cerraste el aviso de desarrollo.",
        ),
        p(
          "Todo eso se queda en tu dispositivo y puedes borrarlo desde la configuración de tu navegador.",
        ),
      ],
    },
    {
      id: "servicios",
      title: "5. Servicios de terceros que se usan",
      blocks: [
        ul(
          "Supabase: base de datos y cuentas (ahí viven negocios, productos, catálogos y pedidos).",
          "Cloudflare: aloja la aplicación y guarda las imágenes que se suben. Las imágenes son públicas por su enlace.",
          "Paddle: checkout y suscripciones, en modo de pruebas.",
        ),
        p(
          "WhatsApp solo interviene si alguien pulsa el enlace para avisar por WhatsApp: el mensaje lo envía esa persona desde su propia cuenta.",
        ),
      ],
    },
    {
      id: "quien-ve",
      title: "6. Quién puede ver un pedido",
      blocks: [
        p(
          "El vendedor dueño del catálogo ve los pedidos de su catálogo y solo los suyos: la base de datos lo limita por cuenta.",
        ),
        p(
          `Si eres comprador y quieres que se corrija o se retire tu pedido, pídeselo al vendedor, que es quien lo gestiona, o escribe a ${COMPANY.contactEmail}.`,
        ),
      ],
    },
    {
      id: "borrar",
      title: "7. Descargar o borrar tus datos",
      blocks: [
        ul(
          "En Configuración, dentro del panel, puedes descargar tus datos en un archivo JSON.",
          "En esa misma pantalla puedes borrar tu cuenta: se eliminan negocio, productos, catálogos, pedidos e imágenes, y se cancela la suscripción de prueba. Es permanente.",
          `Si no puedes entrar a tu cuenta, escribe a ${COMPANY.contactEmail}.`,
        ),
      ],
    },
    {
      id: "seguridad",
      title: "8. Seguridad y cambios",
      blocks: [
        p(
          "Las conexiones van cifradas y la base de datos restringe el acceso para que cada cuenta vea solo sus datos. Aun así es un proyecto en desarrollo: no se puede prometer seguridad absoluta.",
        ),
        p("Si este texto cambia, la nueva versión se publica en esta misma página con su fecha."),
      ],
    },
  ],
};

/* ── Términos ───────────────────────────────────────────────────────────── */
const terms: LegalDoc = {
  slug: "terms",
  path: LEGAL_PATHS.terms,
  file: "terminos",
  title: "Términos de uso",
  description: `Condiciones para usar ${BRAND}: cuenta, planes de prueba, contenido y límites.`,
  version: LEGAL_VERSIONS.terms,
  sections: [
    {
      id: "servicio",
      title: "1. Qué es Catalii",
      blocks: [
        p(
          `${BRAND} es un proyecto escolar que permite importar una lista de productos, armar catálogos públicos con enlace propio y recibir pedidos. Lo mantiene ${COMPANY.owner}.`,
        ),
        p(
          `${BRAND} no participa en la compraventa: precios, disponibilidad, entrega y pago los acuerdan el vendedor y su comprador entre ellos.`,
        ),
      ],
    },
    {
      id: "cuenta",
      title: "2. Tu cuenta",
      blocks: [
        ul(
          "Usa un correo válido al que tengas acceso.",
          "Tu contraseña es tuya: no la compartas.",
          "Lo que se haga desde tu cuenta cuenta como hecho por ti.",
        ),
      ],
    },
    {
      id: "planes",
      title: "3. Planes y pagos",
      blocks: [
        p(
          `Hay un plan gratis y planes de pago con límites distintos (productos, catálogos y pedidos). Los precios y límites que se muestran están en ${BILLING_CURRENCY} en la sección Precios y en Facturación, dentro del panel.`,
        ),
        p(
          "El checkout está en modo de pruebas: no se cobra dinero real y no hace falta usar una tarjeta real. Los precios y los límites pueden cambiar mientras el proyecto siga en desarrollo.",
        ),
      ],
    },
    {
      id: "cancelar",
      title: "4. Cancelar",
      blocks: [
        p(
          "Las suscripciones de prueba se renuevan solas hasta que las canceles. Puedes cancelar desde Facturación: la cancelación se programa para el final del periodo en curso y después no se renueva.",
        ),
        p(
          "Al cancelar, la cuenta vuelve al plan gratis y se aplican sus límites. Tus datos siguen ahí hasta que borres la cuenta.",
        ),
      ],
    },
    {
      id: "reembolsos",
      title: "5. Reembolsos",
      blocks: [
        p(
          `Como los pagos son de prueba y no hay cobros reales, no hay reembolsos que gestionar. Si ves un cargo real en tu cuenta, escribe a ${COMPANY.contactEmail} y se revisa.`,
        ),
      ],
    },
    {
      id: "contenido",
      title: "6. Tu contenido",
      blocks: [
        p(
          "Lo que subes (productos, textos, logos e imágenes) sigue siendo tuyo. Sube solo contenido que puedas publicar, y date cuenta de que las imágenes de un catálogo público quedan accesibles por su enlace.",
        ),
        p(
          `Si crees que una imagen o un texto de algún catálogo usa algo tuyo sin permiso, escribe a ${COMPANY.contactEmail} indicando el enlace del catálogo y qué contenido es: se revisa y, si corresponde, se retira.`,
        ),
      ],
    },
    {
      id: "uso-aceptable",
      title: "7. Qué no hacer",
      blocks: [
        ul(
          "No publicar contenido ilegal ni contenido de otras personas sin permiso.",
          "No usar los catálogos para engañar a los compradores ni para enviar spam.",
          "No intentar entrar en datos de otras cuentas ni tumbar el servicio.",
          "No subir datos personales reales de terceros: esto es un entorno de pruebas.",
        ),
        p("Una cuenta o un contenido que incumpla esto se puede suspender o retirar."),
      ],
    },
    {
      id: "limites",
      title: "8. Límites, cambios y contacto",
      blocks: [
        p(
          "Es un proyecto en desarrollo y se ofrece tal cual: puede fallar, estar caído o perder datos de prueba, y no hay compromiso de disponibilidad ni de soporte.",
        ),
        p(
          `El tratamiento de datos se explica en ${LEGAL_PATHS.privacy}. Estos términos pueden cambiar; la versión vigente aparece al inicio de esta página. Contacto: ${COMPANY.contactEmail}.`,
        ),
      ],
    },
  ],
};

/* ── Contacto ───────────────────────────────────────────────────────────── */
const contact: LegalDoc = {
  slug: "contact",
  path: LEGAL_PATHS.contact,
  file: "contacto",
  title: "Contacto",
  description: `Quién mantiene ${BRAND} y dónde escribir.`,
  version: LEGAL_VERSIONS.terms,
  sections: [
    {
      id: "contacto",
      title: "1. Dónde escribir",
      blocks: [
        ul(
          `Responsable del proyecto: ${COMPANY.owner}`,
          `Institución o materia: ${COMPANY.institution}`,
          `Correo: ${COMPANY.contactEmail}`,
          `Sitio: ${COMPANY.site}`,
        ),
        p(
          "Ese correo sirve para todo: dudas, problemas con la cuenta, datos personales y avisos sobre contenido de un catálogo. Al ser un proyecto escolar, las respuestas no son inmediatas.",
        ),
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDoc["slug"], LegalDoc> = {
  privacy,
  terms,
  contact,
};

/** Fecha/versión legible: "2026-11-12" o "2026-11-12-rev2" → "… (rev2)". */
export function formatVersion(version: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})(?:-(.+))?$/.exec(version);
  return m ? (m[2] ? `${m[1]} (${m[2]})` : m[1]) : version;
}

/** Texto plano de un documento, para buscar marcadores. */
function flatten(doc: LegalDoc): string {
  return doc.sections
    .flatMap((s) => [s.title, ...s.blocks.flatMap((b) => (b.type === "p" ? [b.text] : b.items))])
    .join(" ");
}

/**
 * Cuántos datos sin rellenar (`[COMPLETAR]`) quedan en un documento.
 *
 * Se usa para no indexar un documento incompleto y para avisarlo en la propia
 * página. Cuando llega a cero, deja de avisar y se indexa.
 */
export function pendingMarkers(doc: LegalDoc): { data: number } {
  return { data: flatten(doc).split(COMPLETAR).length - 1 };
}

/** `true` si al documento le falta algún dato. */
export function hasPendingData(doc: LegalDoc): boolean {
  return pendingMarkers(doc).data > 0;
}
