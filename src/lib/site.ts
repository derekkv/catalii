/** Configuración global del sitio (SEO, branding, URLs). */
export const siteConfig = {
  name: "Catalii",
  domain: "catalii.com",
  tagline: "Catálogos digitales para mayoristas",
  description:
    "Convierte tu lista de precios en un catálogo online con enlace propio, sin saber programar. Tus clientes arman el pedido sin crear cuenta y te llega ordenado, con aviso opcional por WhatsApp.",
  locale: "es_EC",
  keywords: [
    "catálogo digital mayorista",
    "software de pedidos mayoristas",
    "catálogo online B2B",
    "lista de precios digital",
    "pedidos por WhatsApp",
  ],
} as const;

/** URL base del sitio, derivada del entorno. Sin barra final. */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const fallback =
    process.env.NODE_ENV === "production" ? "https://catalii.com" : "http://localhost:3000";
  return (fromEnv ?? fallback).replace(/\/$/, "");
}

/**
 * URL base **del dominio por el que entró el usuario**, para los enlaces que se
 * comparten (catálogo público, código QR).
 *
 * `getSiteUrl()` devuelve la URL canónica configurada, que es lo correcto para
 * SEO y metadatos, pero no sirve para compartir: si `NEXT_PUBLIC_SITE_URL`
 * apunta a un dominio que todavía no está conectado al Worker, el mayorista
 * copia un enlace que da 404. Aquí se usa el host real de la petición, así que
 * el enlace funciona tanto en `*.workers.dev` como en el dominio propio cuando
 * se conecte, sin tocar configuración.
 *
 * Solo se puede llamar desde código de servidor (lee cabeceras).
 */
export async function getRequestSiteUrl(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  // `x-forwarded-host` manda cuando hay proxy delante (el caso de Cloudflare).
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return getSiteUrl();
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}
