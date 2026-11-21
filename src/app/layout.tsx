import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";

/*
 * Tipografía — dirección "papel de imprenta comercial".
 *
 *  · Fraunces (display): serif de contraste alto con ejes SOFT/WONK. Tiene
 *    carácter propio; evita el look de plantilla de Inter/Poppins/Playfair.
 *  · Archivo (UI): grotesca de origen tipográfico-periodístico, legible a
 *    tamaños pequeños y con 100–900 para construir jerarquía real.
 *  · JetBrains Mono: SKU, precios, totales y micro-etiquetas. Los datos
 *    tabulares de un catálogo mayorista piden cifras de ancho fijo.
 *
 * Autoalojadas con `next/font/local` desde `src/fonts/` en lugar de
 * `next/font/google`. Motivo: en Next 16.3.x, Turbopack rompe el build cuando
 * la API de Google Fonts responde con URLs de subconjunto dinámico (las que
 * llevan `&` en la query), con el error «Can't resolve
 * '@vercel/turbopack-next/internal/font/google/font'» (vercel/next.js#97344,
 * PR #99132). Es intermitente —depende de lo que devuelva Google en ese
 * momento—, así que compilaba en local y fallaba en Cloudflare. Con los
 * `.woff2` versionados, el build no toca la red y el bug no puede aparecer.
 *
 * Los tres archivos son el subconjunto `latin` (U+0000–00FF más puntuación y
 * €: cubre de sobra el español) del woff2 **variable** que servía la propia
 * API de Google, con los mismos ejes que antes. Licencias en
 * `src/fonts/OFL-*.txt`; ver `CREDITS.md`.
 */
const display = localFont({
  src: "../fonts/Fraunces-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

const body = localFont({
  src: "../fonts/Archivo-latin.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

const mono = localFont({
  src: "../fonts/JetBrainsMono-latin.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
  style: "normal",
});

import { ThemeScript } from "@/components/theme/theme-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { DevBanner } from "@/components/dev-banner";
import { siteConfig, getSiteUrl } from "@/lib/site";

/*
 * Imagen para Open Graph / Twitter: el logo horizontal V2 (2000×640, ratio
 * 3,125:1, dentro del rango que admite `summary_large_image`). Es un archivo
 * real de `public/brand/`, no una ruta generada. La URL se compone con
 * `getSiteUrl()` para que sea absoluta aunque el consumidor ignore
 * `metadataBase`.
 */
const OG_IMAGE = {
  url: `${getSiteUrl()}/brand/catalii-logo-v2-principal.png`,
  width: 2000,
  height: 640,
  alt: `${siteConfig.name} — ${siteConfig.tagline}`,
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: getSiteUrl(),
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * Nonce de la Content-Security-Policy, puesto por `src/middleware.ts` en la
   * cabecera `x-nonce` de esta petición. Lo necesita el script inline del
   * theme (el único de este layout).
   *
   * Leer `headers()` aquí obliga a renderizar en dinámico TODAS las rutas: es
   * inevitable con nonce por petición, porque un HTML cacheado llevaría un
   * nonce viejo que ya no coincide con el de la cabecera. Ver el apartado
   * «Coste: renderizado dinámico» de `docs/seguridad/CSP.md`.
   */
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {/* Salto al contenido: primer tabulador para usuarios de teclado/lector. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-theme-sm)] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary"
        >
          Saltar al contenido
        </a>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
              <DevBanner />
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
