/**
 * Contenido legal — fuente única.
 *
 * Las páginas públicas (src/app/<doc>/page.tsx) y los Markdown de
 * docs/legal/textos/ salen de este archivo. Los datos concretos NO se escriben
 * aquí: viven en `./config` (COMPANY), que es el único sitio que hay que
 * rellenar. Lo que no se sabe queda marcado como [COMPLETAR].
 *
 * Criterio de redacción: textos cortos que solo dicen cosas comprobables en el
 * código (qué se guarda, en qué servicios, qué queda en el navegador, cómo
 * descargar o borrar la cuenta).
 * No afirman cumplimiento normativo, no citan leyes ni plazos legales y no
 * sustituyen a asesoría profesional. Si algo no se puede afirmar, no se escribe.
 */
import { BILLING_CURRENCY, COMPANY, COMPLETAR, LEGAL_PATHS, LEGAL_VERSIONS } from "./config";

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
          `${BRAND} lo desarrolla y mantiene ${COMPANY.owner}. Sirve para que un mayorista publique un catálogo con enlace propio y reciba pedidos.`,
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
          "No hay publicidad, ni píxeles de terceros, y los datos no se venden a nadie. Sí se cuentan visitas a las páginas públicas, pero de forma anónima: ver el punto 6.",
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
          "Google (Gemini): solo si el vendedor importa un archivo de productos. Ver el punto 7.",
        ),
        p(
          "WhatsApp solo interviene si alguien pulsa el enlace para avisar por WhatsApp: el mensaje lo envía esa persona desde su propia cuenta.",
        ),
      ],
    },
    {
      id: "visitas",
      title: "6. Contador de visitas",
      blocks: [
        p(
          "Cuando alguien abre la página de un negocio o un catálogo se guarda un registro de esa visita para que el vendedor y el administrador vean cuántas hubo.",
        ),
        p("De cada visita se guarda:"),
        ul(
          "Qué se vio (negocio o catálogo) y cuándo.",
          "El país, que lo deduce el hosting de la conexión.",
          "Si el enlace venía de otro sitio web, solo el nombre de ese sitio, nunca la dirección completa.",
          "Si el dispositivo es móvil o de escritorio.",
        ),
        p(
          "No se guarda la dirección IP, ni el navegador concreto, ni ninguna cookie o identificador que permita seguir a una misma persona entre visitas: por eso el contador dice visitas y no personas. Los registros se borran solos a los 180 días.",
        ),
      ],
    },
    {
      id: "ia",
      title: "7. Ayuda de IA al importar productos",
      blocks: [
        p(
          "Al importar un archivo de productos (Excel o CSV), el vendedor puede pedir ayuda para adivinar qué columna es el nombre, qué columna es el precio y así con el resto. Esa parte la propone Gemini, de Google.",
        ),
        p("Qué se envía a Google en ese momento:"),
        ul(
          "Los nombres de las columnas del archivo.",
          "Hasta cinco filas de ejemplo, recortadas a 120 caracteres por celda.",
        ),
        p(
          "No se envía el archivo completo, ni su nombre, ni nada de la cuenta, el negocio o los pedidos. La IA solo dice a qué campo corresponde cada columna; no cambia ni rellena ningún dato, y el vendedor confirma la correspondencia antes de que se guarde nada.",
        ),
        p(
          "Es opcional: si no hay clave de Google configurada o la petición falla, la importación sigue funcionando adivinando las columnas por su nombre, sin salir de Catalii. Un archivo con datos de personas (clientes, proveedores) no debería importarse como lista de productos.",
        ),
        p(
          "Según los términos de la API de Gemini, en el nivel gratuito Google puede usar lo enviado para mejorar sus productos y revisores humanos pueden llegar a leerlo; en el nivel de pago, no. Esta versión usa el nivel configurado por quien despliega la aplicación, y por eso en las filas de ejemplo no debe haber nada confidencial.",
        ),
      ],
    },
    {
      id: "quien-ve",
      title: "8. Quién puede ver un pedido",
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
      title: "9. Descargar o borrar tus datos",
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
      title: "10. Seguridad y cambios",
      blocks: [
        p(
          "Las conexiones van cifradas y la base de datos restringe el acceso para que cada cuenta vea solo sus datos. Aun así, ningún servicio puede prometer seguridad absoluta.",
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
          `${BRAND} permite importar una lista de productos, armar catálogos públicos con enlace propio y recibir pedidos. Lo mantiene ${COMPANY.owner}.`,
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
          "El servicio se ofrece tal cual: puede fallar o estar caído, y mientras el checkout siga en pruebas no hay compromiso de disponibilidad ni de soporte.",
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
          `Correo: ${COMPANY.contactEmail}`,
          `Sitio: ${COMPANY.site}`,
        ),
        p(
          "Ese correo sirve para todo: dudas, problemas con la cuenta, datos personales y avisos sobre contenido de un catálogo. También puedes usar el formulario de abajo. Las respuestas no son inmediatas.",
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
