import type { Metadata } from "next";
import { headers } from "next/headers";
import { Fraunces, Archivo, JetBrains_Mono } from "next/font/google";
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
 */
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const body = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
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
