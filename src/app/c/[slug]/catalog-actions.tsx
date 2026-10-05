"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/**
 * Compartir el catálogo desde el propio catálogo.
 *
 * El canal de distribución real de estos catálogos es el reenvío entre
 * compradores por WhatsApp. Sin un botón de compartir, el comprador tiene que
 * copiar la URL de la barra del navegador (en móvil, dentro de un webview de
 * WhatsApp, a veces ni se ve). Usa la Web Share API nativa y cae a portapapeles.
 */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: `Mira el catálogo de ${title}`, url });
        return;
      } catch {
        // El usuario canceló la hoja de compartir: no es un error que avisar.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Enlace copiado.", { tone: "success", duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("No se pudo copiar el enlace.", { tone: "error" });
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Compartir catálogo"
      title="Compartir catálogo"
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="size-5 text-primary" aria-hidden="true" />
      ) : (
        <Share2 className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
