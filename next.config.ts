import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad aplicadas a todas las rutas.
 *
 * La `Content-Security-Policy` NO está aquí: lleva un nonce distinto en cada
 * petición, así que la pone `src/middleware.ts` (ver `docs/seguridad/CSP.md`).
 * Lo de este archivo es lo que no depende de la petición.
 *
 * `X-Frame-Options: SAMEORIGIN` se mantiene aunque la CSP traiga
 * `frame-ancestors 'none'`, que es más estricto y tiene precedencia: sirve de
 * red para navegadores sin CSP3 y mientras la política siga en Report-Only
 * (en ese modo `frame-ancestors` no bloquea nada).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev({ configPath: "./wrangler.dev.jsonc" });
}
