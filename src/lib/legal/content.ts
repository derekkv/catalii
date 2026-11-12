/**
 * Contenido legal — fuente única.
 *
 * Las páginas públicas (src/app/<doc>/page.tsx) y los Markdown de
 * docs/legal/textos/ salen de este archivo. Los datos concretos NO se escriben
 * aquí: viven en `./config` (COMPANY y LEGAL_DATA), que es el único sitio que
 * hay que rellenar. Nada se inventa: lo que no se sabe queda marcado como
 * [COMPLETAR] (dato del dueño) o [PREGUNTAR A ABOGADO] (decisión jurídica).
 */
import {
  ABOGADO,
  BILLING_CURRENCY,
  COMPANY,
  COMPLETAR,
  LEGAL_DATA as D,
  LEGAL_PATHS,
  LEGAL_VERSIONS,
} from "./config";

export { ABOGADO } from "./config";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export type LegalDoc = {
  slug: "privacy" | "terms" | "refunds" | "copyright" | "providers" | "contact";
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
  title: "Política de privacidad",
  description: `Qué datos trata ${BRAND}, para qué, con quién y cómo ejercer tus derechos.`,
  version: LEGAL_VERSIONS.privacy,
  sections: [
    {
      id: "quienes-somos",
      title: "1. Quiénes somos",
      blocks: [
        p(
          `${BRAND} es un servicio para que mayoristas y distribuidores publiquen catálogos en línea y reciban pedidos. Lo opera ${COMPANY.legalName} (identificación fiscal: ${COMPANY.taxId}), con domicilio en ${COMPANY.address}, país: ${COMPANY.country}.`,
        ),
        p(`Contacto sobre privacidad: ${COMPANY.privacyEmail}.`),
      ],
    },
    {
      id: "roles",
      title: "2. Roles: mayorista y Catalii",
      blocks: [
        p(
          `Hay dos tipos de personas cuyos datos se tratan: (a) los mayoristas que crean una cuenta en ${BRAND}, y (b) los compradores que envían un pedido desde el catálogo público de un mayorista.`,
        ),
        p(
          `Los datos que un comprador escribe en el formulario de pedido los recoge el mayorista, a través de ${BRAND}, para atender ese pedido. Quién es "responsable" y quién "encargado" del tratamiento de esos datos (el mayorista, ${BRAND} o ambos según el caso) ${ABOGADO}.`,
        ),
        p(
          `Mientras tanto: ${BRAND} trata los datos de la cuenta del mayorista para prestar el servicio, y trata los datos de los pedidos para guardarlos y mostrárselos al mayorista que corresponde.`,
        ),
      ],
    },
    {
      id: "datos",
      title: "3. Qué datos tratamos",
      blocks: [
        p("Mayoristas (titulares de cuenta):"),
        ul(
          "Correo electrónico y contraseña (la contraseña la gestiona el proveedor de autenticación; no la vemos en claro).",
          "Nombre y apellido, si los indicas (opcional).",
          "Datos del negocio: nombre, enlace público, apariencia, WhatsApp y correo de contacto del negocio (opcionales).",
          "Logo, banner y fotos de productos que subes, y los productos, precios y catálogos que creas.",
          "Datos de suscripción: identificador de cliente y de suscripción, estado y plan. Los datos de pago (tarjeta, facturación) los recoge Paddle; nosotros no los guardamos.",
        ),
        p("Compradores (quienes envían un pedido):"),
        ul(
          "Nombre y número de WhatsApp (obligatorios para enviar el pedido).",
          "Correo electrónico (opcional).",
          "Notas del pedido (texto libre; evita incluir datos que no quieras compartir, por ejemplo una dirección, si no es necesario).",
          "Las líneas del pedido: productos, cantidades y precios.",
        ),
        p("Todos los visitantes:"),
        ul(
          `Datos técnicos inherentes a cualquier conexión (dirección IP, navegador, fecha y hora) que procesan los proveedores de alojamiento. No los almacenamos en nuestras propias tablas. Retención de esos registros: ${D.retentionServerLogs}.`,
        ),
      ],
    },
    {
      id: "finalidades",
      title: "4. Para qué los usamos",
      blocks: [
        ul(
          "Crear y mantener tu cuenta, iniciar sesión y recuperar la contraseña.",
          "Mostrar tus catálogos públicos y registrar los pedidos que reciben.",
          "Que el mayorista pueda contactar al comprador por el pedido (nombre, WhatsApp, correo, notas).",
          "Cobrar y gestionar la suscripción de los planes de pago.",
          "Mantener la seguridad y el funcionamiento del servicio.",
        ),
        p(
          `Base jurídica o legitimación de cada finalidad: ${ABOGADO}. Actualmente ${BRAND} no usa tus datos para publicidad ni los vende, y no incluye analítica ni píxeles de terceros.`,
        ),
      ],
    },
    {
      id: "almacenamiento-local",
      title: "5. Cookies y almacenamiento local",
      blocks: [
        ul(
          "Cookies de sesión de Supabase (nombre que empieza por sb-…-auth-token): mantienen tu sesión si eres mayorista y has iniciado sesión.",
          "catalii-theme (almacenamiento local): recuerda la apariencia elegida.",
          "catalii-cart:<catálogo> (almacenamiento local): conserva el carrito del comprador en ese dispositivo.",
          "catalii-buyer (almacenamiento local): guarda nombre, teléfono y correo del comprador solo si marca la casilla «Recordar mis datos en este dispositivo». Si no la marca, no se guarda y se borra lo que hubiera.",
          "catalii-dev-notice-dismissed (almacenamiento local): recuerda que cerraste el aviso de desarrollo, cuando está activo.",
        ),
        p(
          `Estos datos se quedan en tu dispositivo; puedes borrarlos desde la configuración de tu navegador. Si necesitan consentimiento o un aviso adicional: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "proveedores",
      title: "6. Con quién los compartimos",
      blocks: [
        p(
          `Usamos proveedores que tratan datos por cuenta de ${BRAND}. Están descritos en la página de proveedores (${LEGAL_PATHS.providers}):`,
        ),
        ul(
          "Supabase: base de datos y autenticación.",
          "Cloudflare (Workers y R2): alojamiento de la aplicación y almacenamiento de imágenes.",
          "Paddle: cobro de suscripciones.",
          "WhatsApp (Meta): solo si el usuario pulsa el enlace para avisar por WhatsApp; el mensaje lo envía el propio usuario.",
        ),
        p(
          `El mayorista dueño del catálogo ve los pedidos y datos de los compradores de su catálogo. Transferencias internacionales y garantías: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "plazos",
      title: "7. Cuánto tiempo los conservamos",
      blocks: [
        ul(
          `Cuenta y datos del negocio: ${D.retentionAccount}.`,
          `Pedidos y datos de compradores: ${D.retentionOrders}.`,
          `Datos de suscripción y facturación: ${D.retentionBilling} (plazos fiscales o contables: ${ABOGADO}).`,
          `Registros técnicos: ${D.retentionTechnical}.`,
          `Copias de seguridad: ${D.retentionBackups}.`,
        ),
      ],
    },
    {
      id: "derechos",
      title: "8. Tus derechos y cómo ejercerlos",
      blocks: [
        p(
          `Puedes pedir acceso, rectificación, eliminación y otras acciones sobre tus datos (los derechos concretos y sus plazos dependen de la ley aplicable: ${ABOGADO}).`,
        ),
        ul(
          `Escribe a ${COMPANY.privacyEmail} indicando tu nombre, el correo de tu cuenta (o, si eres comprador, el catálogo y el número de WhatsApp usados) y qué quieres hacer.`,
          "En Configuración del panel puedes descargar tus datos en un archivo JSON y borrar tu cuenta.",
          `Plazo de respuesta: ${D.rightsResponseTime}.`,
          `Si eres comprador, también puedes pedirle al mayorista del catálogo que borre o corrija tu pedido; ese mayorista responde por los datos que recibió: ${ABOGADO}.`,
        ),
        p(`Autoridad ante la que reclamar: ${D.dataAuthority} (${ABOGADO}).`),
      ],
    },
    {
      id: "menores",
      title: "9. Menores de edad",
      blocks: [
        p(
          `${BRAND} está pensado para negocios y no está dirigido a menores. Edad mínima y tratamiento de datos de menores: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "seguridad",
      title: "10. Seguridad",
      blocks: [
        p(
          "Usamos conexiones cifradas y control de acceso a nivel de base de datos para que cada mayorista vea solo sus datos. Ningún sistema es infalible; no podemos garantizar seguridad absoluta.",
        ),
      ],
    },
    {
      id: "cambios",
      title: "11. Cambios a esta política",
      blocks: [
        p(
          `Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha. Cómo avisaremos a los usuarios registrados: ${D.privacyChangeNotice}.`,
        ),
      ],
    },
  ],
};

/* ── Términos ───────────────────────────────────────────────────────────── */
const terms: LegalDoc = {
  slug: "terms",
  path: LEGAL_PATHS.terms,
  file: "terminos",
  title: "Términos del servicio",
  description: `Condiciones para usar ${BRAND}: planes, renovación, cancelación, contenido y responsabilidad.`,
  version: LEGAL_VERSIONS.terms,
  sections: [
    {
      id: "servicio",
      title: "1. El servicio",
      blocks: [
        p(
          `${BRAND} permite a mayoristas y distribuidores importar una lista de productos, armar catálogos públicos con enlace propio y recibir pedidos de sus compradores. Lo ofrece ${COMPANY.legalName}, con domicilio en ${COMPANY.address}.`,
        ),
        p(
          `${BRAND} no es parte de la compraventa entre el mayorista y su comprador: precios, disponibilidad, entrega y pago los acuerdan ellos.`,
        ),
      ],
    },
    {
      id: "cuenta",
      title: "2. Tu cuenta",
      blocks: [
        ul(
          "Debes dar un correo válido y mantener tu contraseña en secreto.",
          "Eres responsable de lo que ocurra con tu cuenta.",
          `Edad mínima y uso por menores: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "planes",
      title: "3. Planes y precios",
      blocks: [
        p(
          `Hay un plan gratis y planes de pago con límites distintos (productos, catálogos, etc.). Los precios y límites vigentes se muestran en la sección Precios del sitio y en Facturación dentro del panel. Los planes se cobran en ${BILLING_CURRENCY}. Impuestos incluidos o no en el precio: ${D.taxesIncluded}.`,
        ),
        p("Podemos cambiar precios y límites; los cambios aplicables a suscripciones activas: " + ABOGADO + "."),
      ],
    },
    {
      id: "renovacion",
      title: "4. Renovación automática y cancelación",
      blocks: [
        p(
          "Los planes de pago se renuevan automáticamente cada mes y se cobran hasta que canceles.",
        ),
        ul(
          "Puedes cancelar desde Facturación, dentro del panel: la cancelación se programa para el final del periodo ya pagado y no se renueva después.",
          `Qué ocurre con tu plan y tus datos al cancelar o al dejar de pagar: ${D.cancelConsequences}.`,
          `Los pagos los procesa Paddle. Reembolsos: consulta la política de reembolsos (${LEGAL_PATHS.refunds}).`,
        ),
      ],
    },
    {
      id: "reembolsos",
      title: "5. Reembolsos",
      blocks: [
        p(
          `Las condiciones de reembolso están en ${LEGAL_PATHS.refunds}. Nada en estos términos recorta los derechos que la ley reconozca a los consumidores: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "contenido",
      title: "6. Tu contenido",
      blocks: [
        p(
          "Eres responsable del contenido que subes (productos, textos, logos e imágenes) y garantizas que tienes derecho a usarlo y publicarlo. Nos concedes el permiso necesario para almacenarlo, procesarlo y mostrarlo en tus catálogos. Alcance y duración exacta de esa licencia: " +
            ABOGADO +
            ".",
        ),
        p(
          `Si crees que un contenido infringe tus derechos, consulta ${LEGAL_PATHS.copyright}.`,
        ),
      ],
    },
    {
      id: "uso-aceptable",
      title: "7. Uso aceptable",
      blocks: [
        ul(
          "No publiques contenido ilegal o que infrinja derechos de terceros.",
          "No uses el servicio para engañar a compradores ni para enviar spam.",
          "No intentes acceder a datos de otras cuentas ni interrumpir el servicio.",
          `Rubros prohibidos o restringidos: ${D.restrictedCategories}.`,
        ),
        p(`Podemos suspender o retirar contenido o cuentas que incumplan estas reglas. Procedimiento: ${ABOGADO}.`),
      ],
    },
    {
      id: "datos",
      title: "8. Datos personales",
      blocks: [
        p(`El tratamiento de datos personales se describe en la política de privacidad (${LEGAL_PATHS.privacy}).`),
      ],
    },
    {
      id: "responsabilidad",
      title: "9. Disponibilidad y responsabilidad",
      blocks: [
        p(
          `El servicio se ofrece "tal cual", sin promesa de disponibilidad ininterrumpida. Límites y exclusiones de responsabilidad: ${ABOGADO}. Esto no limita responsabilidades que la ley no permita limitar.`,
        ),
      ],
    },
    {
      id: "cambios",
      title: "10. Cambios a los términos",
      blocks: [
        p(
          `Podemos actualizar estos términos. La versión vigente se indica al inicio de esta página. Cómo avisaremos de cambios importantes: ${D.termsChangeNotice}.`,
        ),
      ],
    },
    {
      id: "ley",
      title: "11. Ley aplicable y jurisdicción",
      blocks: [
        p(`Ley aplicable: ${D.governingLaw}. Tribunales o mecanismo de resolución de disputas: ${D.jurisdiction}. ${ABOGADO}.`),
      ],
    },
    {
      id: "contacto",
      title: "12. Contacto",
      blocks: [p(`${COMPANY.contactEmail}. Más datos en ${LEGAL_PATHS.contact}.`)],
    },
  ],
};

/* ── Reembolsos ─────────────────────────────────────────────────────────── */
const refunds: LegalDoc = {
  slug: "refunds",
  path: LEGAL_PATHS.refunds,
  file: "reembolsos",
  title: "Política de reembolsos",
  description: `Cuándo y cómo se puede pedir un reembolso de una suscripción de ${BRAND}.`,
  version: LEGAL_VERSIONS.terms,
  sections: [
    {
      id: "alcance",
      title: "1. A qué se aplica",
      blocks: [
        p(
          `A las suscripciones de pago de ${BRAND}, que se renuevan cada mes hasta que canceles. El plan gratis no tiene costo.`,
        ),
      ],
    },
    {
      id: "quien",
      title: "2. Quién puede pedirlo",
      blocks: [p(`Condiciones para solicitar un reembolso: ${D.refundEligibility}.`)],
    },
    {
      id: "como",
      title: "3. Cómo pedirlo",
      blocks: [
        p(
          `Escribe a ${COMPANY.contactEmail} indicando el correo de tu cuenta y la fecha del cobro. Los pagos los procesa Paddle; quién gestiona el reembolso: ${D.refundHandler}.`,
        ),
      ],
    },
    {
      id: "plazo",
      title: "4. Plazos",
      blocks: [
        ul(
          `Plazo para solicitarlo: ${D.refundRequestWindow}.`,
          `Plazo de respuesta y de devolución del dinero: ${D.refundResponseTime}.`,
        ),
      ],
    },
    {
      id: "cancelar",
      title: "5. Cancelar no es reembolsar",
      blocks: [
        p(
          `Cancelar desde Facturación evita futuros cobros. Si se reembolsa o no el periodo ya pagado: ${D.refundAfterCancel}.`,
        ),
      ],
    },
    {
      id: "consumo",
      title: "6. Derechos de los consumidores",
      blocks: [
        p(
          `Esta política no recorta los derechos que la ley reconozca a los consumidores en tu país: ${ABOGADO}.`,
        ),
      ],
    },
  ],
};

/* ── Derechos de autor ──────────────────────────────────────────────────── */
const copyright: LegalDoc = {
  slug: "copyright",
  path: LEGAL_PATHS.copyright,
  file: "derechos-de-autor",
  title: "Derechos de autor y reclamos de contenido",
  description: `Cómo avisar a ${BRAND} si un catálogo publica contenido que infringe tus derechos.`,
  version: LEGAL_VERSIONS.terms,
  sections: [
    {
      id: "contexto",
      title: "1. Contexto",
      blocks: [
        p(
          `Los catálogos los crean los mayoristas y pueden incluir imágenes, textos y marcas. Si crees que alguno infringe tus derechos de autor, marca u otros derechos, puedes avisarnos.`,
        ),
      ],
    },
    {
      id: "canal",
      title: "2. Dónde enviar el reclamo",
      blocks: [
        p(`Correo: ${COMPANY.copyrightEmail}.`),
        p(
          `Régimen legal aplicable a estos avisos (por ejemplo, si ${BRAND} adopta algún procedimiento formal de notificación y retirada) y registro de agente, si procede: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "contenido",
      title: "3. Qué incluir en el reclamo",
      blocks: [
        ul(
          "Tu nombre y datos de contacto.",
          "La dirección (URL) del catálogo y del producto o imagen afectados.",
          "Descripción de la obra o derecho que consideras infringido y por qué eres titular o estás autorizado a actuar por el titular.",
          "Una declaración de que la información es exacta y de buena fe.",
        ),
      ],
    },
    {
      id: "procedimiento",
      title: "4. Qué hacemos al recibirlo",
      blocks: [
        ul(
          `Acusamos recibo en un plazo de ${D.copyrightAckTime}.`,
          "Podemos retirar o desactivar temporalmente el contenido señalado mientras se revisa.",
          "Avisamos al mayorista responsable del catálogo y le damos oportunidad de responder.",
          `Si el contenido se retira, se restablece o se rechaza el reclamo, te lo comunicaremos. Plazos y condiciones: ${D.copyrightProcessTimes}.`,
          `Medidas ante reincidencia: ${ABOGADO}.`,
        ),
      ],
    },
    {
      id: "responsabilidad",
      title: "5. Reclamos falsos",
      blocks: [
        p(
          `Enviar un reclamo falso o de mala fe puede tener consecuencias legales. Alcance exacto: ${ABOGADO}.`,
        ),
      ],
    },
  ],
};

/* ── Proveedores ────────────────────────────────────────────────────────── */
const providers: LegalDoc = {
  slug: "providers",
  path: LEGAL_PATHS.providers,
  file: "proveedores",
  title: "Proveedores que tratan datos",
  description: `Servicios de terceros que ${BRAND} usa para funcionar y qué hace cada uno.`,
  version: LEGAL_VERSIONS.privacy,
  sections: [
    {
      id: "lista",
      title: "1. Proveedores",
      blocks: [
        p("Para cada proveedor se indica su función y dónde procesa los datos."),
        ul(
          `Supabase — base de datos y autenticación (cuentas, negocios, productos, catálogos, pedidos y datos de compradores). País/región: ${D.regionSupabase}.`,
          `Cloudflare Workers — alojamiento de la aplicación y registros de operación. País/región: ${D.regionWorkers}.`,
          `Cloudflare R2 — almacenamiento de imágenes (logos, banners, fotos de producto), que son de acceso público por URL. País/región: ${D.regionR2}.`,
          `Paddle — cobro de suscripciones y recibos. Recibe correo y datos de pago/facturación. País/región y rol de Paddle ante el cliente: ${D.regionPaddle} (${ABOGADO}).`,
        ),
      ],
    },
    {
      id: "otros",
      title: "2. Otros servicios",
      blocks: [
        p(
          "WhatsApp (Meta) solo interviene si el usuario pulsa un enlace para enviar un mensaje; no enviamos datos a WhatsApp por nuestra cuenta.",
        ),
        p(`Contratos de tratamiento de datos con cada proveedor: ${D.dpaStatus} (${ABOGADO}).`),
      ],
    },
    {
      id: "mas-info",
      title: "3. Más información",
      blocks: [
        p(
          `Cómo usamos los datos: política de privacidad (${LEGAL_PATHS.privacy}). Preguntas: ${COMPANY.privacyEmail}.`,
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
  description: `Datos de la empresa que opera ${BRAND} y canales de contacto.`,
  version: LEGAL_VERSIONS.terms,
  sections: [
    {
      id: "empresa",
      title: "1. Quién opera Catalii",
      blocks: [
        ul(
          `Nombre legal: ${COMPANY.legalName}`,
          `Identificación fiscal: ${COMPANY.taxId}`,
          `Domicilio: ${COMPANY.address}`,
          `País: ${COMPANY.country}`,
          `Sitio: ${COMPANY.site}`,
        ),
      ],
    },
    {
      id: "canales",
      title: "2. Canales",
      blocks: [
        ul(
          `Contacto general y soporte: ${COMPANY.contactEmail}`,
          `Privacidad y derechos sobre tus datos: ${COMPANY.privacyEmail}`,
          `Reclamos de derechos de autor: ${COMPANY.copyrightEmail}`,
        ),
        p(`Tiempo de respuesta: ${D.supportResponseTime}.`),
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDoc["slug"], LegalDoc> = {
  privacy,
  terms,
  refunds,
  copyright,
  providers,
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
 * Marcadores que quedan en un documento: datos del dueño sin rellenar
 * (`[COMPLETAR]`) y decisiones jurídicas sin resolver (`[PREGUNTAR A ABOGADO]`).
 *
 * Se usa para no indexar un documento incompleto y para avisarlo en la propia
 * página. Cuando los dos contadores llegan a cero, deja de avisar y se indexa.
 */
export function pendingMarkers(doc: LegalDoc): { data: number; legal: number } {
  const text = flatten(doc);
  return {
    data: text.split(COMPLETAR).length - 1,
    legal: text.split(ABOGADO).length - 1,
  };
}

/** `true` si al documento le falta algún dato o decisión. */
export function hasPendingData(doc: LegalDoc): boolean {
  const { data, legal } = pendingMarkers(doc);
  return data + legal > 0;
}
