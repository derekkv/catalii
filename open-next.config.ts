import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * Configuración del adaptador OpenNext para Cloudflare Workers.
 *
 * ISR habilitado para las páginas con `revalidate` (catálogo público /c/[slug]
 * y sitemap):
 *  - incrementalCache: guarda las páginas renderizadas en un bucket R2
 *    (binding NEXT_INC_CACHE_R2_BUCKET en wrangler.jsonc).
 *  - queue: revalidación en background vía Durable Object (NEXT_CACHE_DO_QUEUE),
 *    para servir contenido cacheado y regenerarlo sin bloquear la respuesta.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
