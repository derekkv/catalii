import type { MetricKind } from "./types";

/**
 * Envío de métricas desde el navegador.
 *
 * Decisiones (y por qué, porque esto corre en la página que vende):
 *
 *  · **Route handler + `navigator.sendBeacon`**, no server action. Una server
 *    action se envía al mismo endpoint de la ruta y Next devuelve un payload
 *    RSC con el árbol de la página: contar una visita obligaría al servidor a
 *    renderizar el catálogo otra vez. El beacon es una petición suelta que el
 *    navegador manda en segundo plano, sobrevive a la navegación y no toca el
 *    árbol de React.
 *  · **Nunca lanza.** Todo va dentro de `try`, y el `fetch` de reserva se
 *    ignora con `.catch()`. Si la métrica falla, el comprador no se entera.
 *  · **No cuenta en desarrollo.** `.env.local` suele apuntar al mismo backend
 *    que producción: sin este corte, cada recarga mientras se trabaja sumaría
 *    visitas falsas al panel del mayorista. `NODE_ENV` se incrusta al
 *    compilar, así que en el bundle de producción esta rama desaparece.
 *
 * `order_sent` no se manda desde aquí (ni existe como `MetricKind`): ya queda
 * registrado como fila en `order`, y contarlo otra vez daría dos cifras que se
 * contradicen en cuanto un pedido falle a medias.
 */
export type TrackableMetric = MetricKind;

const ENDPOINT = "/api/metric";

export interface MetricTarget {
  /** Slug del catálogo (eventos de catálogo). */
  catalogSlug?: string | null;
  /** Slug del negocio (eventos de la página del negocio). */
  businessSlug?: string | null;
}

export function sendMetric(kind: TrackableMetric, target: MetricTarget): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    kind,
    catalogSlug: target.catalogSlug ?? null,
    businessSlug: target.businessSlug ?? null,
    // De dónde llegó la visita. El servidor lo reduce al host (nunca guarda la
    // URL completa) y descarta la navegación dentro del propio sitio. Va en el
    // cuerpo porque el `Referer` del beacon es esta misma página.
    referrer: typeof document === "undefined" ? null : document.referrer || null,
  });

  try {
    if (typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
      if (queued) return;
    }
    // Reserva para navegadores sin sendBeacon (o si la cola está llena).
    // `keepalive` permite que termine aunque la pestaña navegue.
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      cache: "no-store",
    }).catch(() => {
      /* la métrica es prescindible */
    });
  } catch {
    /* la métrica es prescindible */
  }
}
