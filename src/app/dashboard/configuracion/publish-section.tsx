"use client";

import { useState } from "react";
import { Copy, Check, Globe, Lock, ExternalLink, Package } from "lucide-react";
import { CheckboxCard } from "./form-fields";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Publicación de la página del negocio.
 *
 * Es el mismo guion que el catálogo: la ficha de compartir muestra el enlace
 * sólo cuando está publicado y, si no, explica por qué no hay enlace todavía
 * (`catalogos/[id]/share-card.tsx`); la casilla de publicar vive dentro del
 * formulario y cambia de aspecto según el estado
 * (`catalogos/[id]/catalog-editor.tsx`).
 *
 * El enlace que se muestra usa el slug GUARDADO, no el que haya escrito el
 * usuario en el campo de arriba: hasta que no guarde, esa otra dirección no
 * existe.
 */
export function PublishSection({
  publicUrl,
  savedIsPublic,
  isPublic,
  onIsPublicChange,
  showProducts,
  onShowProductsChange,
  activeProducts,
  publicCatalogs,
  slugChanged,
}: {
  publicUrl: string;
  /** Estado en la base de datos (el enlace sólo funciona si es `true`). */
  savedIsPublic: boolean;
  isPublic: boolean;
  onIsPublicChange: (next: boolean) => void;
  showProducts: boolean;
  onShowProductsChange: (next: boolean) => void;
  /** Productos activos del negocio. */
  activeProducts: number;
  /** Catálogos publicados: sin ninguno, la página no tiene qué listar. */
  publicCatalogs: number;
  slugChanged: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast("Enlace copiado.", { tone: "success", duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("No se pudo copiar. Selecciona el enlace y cópialo a mano.", { tone: "error" });
    }
  }

  return (
    <section aria-labelledby="publicacion" className="space-y-4 rule-t pt-6">
      <div className="space-y-1.5">
        <h2 id="publicacion" className="t-h2">
          Publicación
        </h2>
        <p className="t-small text-muted-foreground">
          Decide si tu negocio tiene una página que cualquiera pueda abrir.
        </p>
      </div>

      {savedIsPublic ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-[var(--radius-theme-sm)] border border-border bg-muted px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-sm" title={publicUrl}>
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-label="Copiar el enlace de tu página de negocio"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] transition-colors hover:bg-card focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {copied ? (
                <Check className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <ExternalLink className="size-4" aria-hidden="true" /> Ver como cliente
            </Button>
          </a>
          {slugChanged && (
            <p className="text-xs font-medium text-accent">
              Si guardas el enlace nuevo, esta dirección dejará de funcionar.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-[var(--radius-theme-sm)] bg-muted p-4">
          <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">Tu página de negocio es privada</p>
            <p className="text-muted-foreground">
              Marca la casilla y guarda para obtener su enlace. Mientras siga privada, nadie puede
              abrirla ni aparece en buscadores.
            </p>
          </div>
        </div>
      )}

      <CheckboxCard
        id="is_public"
        name="is_public"
        checked={isPublic}
        onChange={onIsPublicChange}
        tone="on"
        icon={
          isPublic ? (
            <Globe className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <Lock className="size-4" aria-hidden="true" />
          )
        }
        title={isPublic ? "Página publicada" : "Página privada"}
      >
        {isPublic
          ? "Cualquiera con el enlace podrá ver los datos de esta pantalla marcados como públicos."
          : "Nadie puede abrirla, ni con el enlace. Tus catálogos publicados siguen funcionando igual."}
      </CheckboxCard>

      <CheckboxCard
        id="show_products"
        name="show_products"
        checked={showProducts}
        onChange={onShowProductsChange}
        icon={<Package className="size-4" aria-hidden="true" />}
        title="Mostrar mis productos en la página"
      >
        {!showProducts
          ? "La página mostrará sólo la presentación de tu negocio, sin productos ni precios."
          : publicCatalogs === 0
            ? "Tu página lista los productos de tus catálogos publicados, y todavía no tienes ninguno publicado: por ahora esa sección no aparecerá."
            : activeProducts === 0
              ? "Aún no tienes productos visibles, así que esa sección no aparecerá."
              : "Se listan los productos visibles de tus catálogos publicados. Desmárcalo si prefieres una página de presentación, sin precios."}
      </CheckboxCard>
    </section>
  );
}
