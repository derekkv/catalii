"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/**
 * Acciones rápidas por catálogo.
 *
 * Copiar el enlace y mandarlo por WhatsApp es la tarea que el mayorista repite
 * varias veces al día. Antes había que entrar al detalle del catálogo para
 * llegar a ella; aquí vive en la propia tarjeta de la lista.
 */
export function CatalogQuickActions({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Enlace copiado.", { tone: "success", duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("No se pudo copiar el enlace.", { tone: "error" });
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(
    `Mira nuestro catálogo "${name}": ${url}`,
  )}`;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar enlace de ${name}`}
        title="Copiar enlace"
        className="flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? (
          <Check className="size-4 text-primary" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Compartir ${name} por WhatsApp`}
        title="Compartir por WhatsApp"
        className="flex size-11 items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
