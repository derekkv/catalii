"use client";

import { useEffect, useRef } from "react";
import { sendMetric, type MetricTarget, type TrackableMetric } from "@/lib/metrics/track";

/**
 * Cuenta una visita al montar, y una sola vez.
 *
 * No renderiza nada, así que no afecta al layout ni al primer pintado: el
 * efecto corre después de que el navegador pinte la página y el envío es un
 * beacon en segundo plano.
 *
 * El `ref` evita el doble conteo por re-render o por el doble montaje del
 * modo estricto de React en desarrollo. Una navegación de cliente a otro
 * catálogo sí vuelve a contar, que es lo correcto: es otra visita.
 */
export function TrackPageView({
  kind,
  catalogSlug,
  businessSlug,
}: { kind: Extract<TrackableMetric, "business_view" | "catalog_view"> } & MetricTarget) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    sendMetric(kind, { catalogSlug, businessSlug });
  }, [kind, catalogSlug, businessSlug]);

  return null;
}
