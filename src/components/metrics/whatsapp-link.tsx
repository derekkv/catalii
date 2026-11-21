"use client";

import { sendMetric, type MetricTarget } from "@/lib/metrics/track";

/**
 * Enlace de WhatsApp que además cuenta el clic.
 *
 * Es un `<a>` normal: el enlace funciona igual con JavaScript roto, y el
 * conteo va en el `onClick` sin `preventDefault` ni `await`, así que no
 * retrasa la apertura de WhatsApp. Abre en otra pestaña, así que la página
 * sigue viva y el beacon llega de todas formas.
 */
export function WhatsappLink({
  href,
  className,
  label,
  title,
  catalogSlug,
  businessSlug,
  children,
}: {
  href: string;
  className?: string;
  /** Texto para lectores de pantalla cuando el enlace es solo un icono. */
  label?: string;
  title?: string;
  children: React.ReactNode;
} & MetricTarget) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={title}
      className={className}
      onClick={() => sendMetric("whatsapp_click", { catalogSlug, businessSlug })}
    >
      {children}
    </a>
  );
}
