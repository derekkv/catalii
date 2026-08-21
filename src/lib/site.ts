/** Configuración global del sitio (SEO, branding, URLs). */
export const siteConfig = {
  name: "Catalii",
  domain: "catalii.com",
  tagline: "Catálogos digitales para mayoristas",
  description:
    "Convierte tu lista de precios en un catálogo online con pedidos en 10 minutos, sin saber programar. Stock en tiempo real, precios por cliente y pedidos directos por WhatsApp.",
  locale: "es_MX",
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
