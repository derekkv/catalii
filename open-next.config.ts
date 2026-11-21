import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Configuración del adaptador de Cloudflare.
 *
 * Sin caché incremental (ISR) ni cola de revalidación, a propósito. Antes
 * usaba `r2IncrementalCache` + `doQueue`, y se quitaron por dos motivos:
 *
 *  1. No servían de nada. La caché incremental solo actúa sobre páginas
 *     prerenderizadas, y en esta app no queda ninguna: el catálogo público y el
 *     panel ya eran dinámicos porque `createClient()` lee cookies, y desde que
 *     la Content-Security-Policy usa un nonce por petición (src/middleware.ts),
 *     el layout raíz lee `headers()` y eso vuelve dinámicas también la landing
 *     y las páginas legales. El `revalidate` del catálogo no tenía efecto.
 *
 *  2. Rompían el despliegue. `opennextjs-cloudflare deploy` intentaba poblar el
 *     bucket remoto de caché antes de desplegar y fallaba en Workers Builds
 *     («Could not determine Cloudflare auth credentials after login»), porque
 *     ese paso quiere credenciales de API que el entorno de build no expone
 *     como espera. Además el Durable Object `DOQueueHandler` no venía exportado
 *     en el worker generado, así que la revalidación en segundo plano tampoco
 *     habría funcionado en ejecución.
 *
 * Si algún día vuelve a haber páginas estáticas que convenga cachear (por
 * ejemplo si se renuncia al nonce de la CSP), se reactiva añadiendo aquí
 * `incrementalCache`/`queue` y devolviendo a `wrangler.jsonc` el bucket
 * `NEXT_INC_CACHE_R2_BUCKET`, los `durable_objects` y sus `migrations`.
 */
export default defineCloudflareConfig({});
