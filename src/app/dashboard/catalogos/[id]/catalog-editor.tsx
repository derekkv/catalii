"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Globe, Lock } from "lucide-react";
import { updateCatalog, deleteCatalog, type CatalogState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError, FieldHint } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { ThemeSwatch, ThemeSwatchInherit } from "@/components/theme/theme-swatch";
import { THEMES, resolveTheme } from "@/lib/themes";
import { slugify, cn } from "@/lib/utils";
import type { Catalog } from "@/types/database";

const initial: CatalogState = { ok: false };

export function CatalogConfigForm({
  catalog,
  siteUrl,
  productCount,
}: {
  catalog: Catalog;
  siteUrl: string;
  productCount: number;
}) {
  // Cadena vacía = heredar del negocio. Si hay un theme guardado se
  // normaliza, para que un id antiguo no deje la selección en blanco.
  const currentTheme = catalog.theme ? resolveTheme(catalog.theme) : "";
  const [slug, setSlug] = useState(catalog.slug);
  const [isPublic, setIsPublic] = useState(catalog.is_public);
  const router = useRouter();
  const { toast } = useToast();

  const [state, action, pending] = useActionState(
    async (prev: CatalogState, formData: FormData) => {
      const result = await updateCatalog(prev, formData);
      if (result.ok) {
        toast(result.message ?? "Catálogo actualizado.", { tone: "success" });
        router.refresh();
      }
      return result;
    },
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={catalog.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre interno</Label>
          <Input id="name" name="name" required maxLength={120} defaultValue={catalog.name} />
          <FieldHint>Solo lo ves tú, en este panel.</FieldHint>
        </div>
        <div>
          <Label htmlFor="display_name">Nombre visible</Label>
          <Input
            id="display_name"
            name="display_name"
            maxLength={120}
            defaultValue={catalog.display_name ?? ""}
            placeholder="Nombre que verán tus clientes"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="slug">Enlace público</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={(e) => setSlug(slugify(e.target.value))}
        />
        {/* Vista previa de la URL: cambiar el slug rompe los enlaces y QR ya
            compartidos, conviene que se vea antes de guardar. */}
        <p className="mt-1 truncate text-xs text-muted-foreground">
          <span className="font-mono">
            {siteUrl}/c/{slugify(slug) || "…"}
          </span>
        </p>
        {slug !== catalog.slug && (
          <p className="mt-1 text-xs font-medium text-accent">
            Al cambiar el enlace, los QR y links que ya compartiste dejarán de funcionar.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="whatsapp">WhatsApp de pedidos</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          inputMode="tel"
          placeholder="+52 55 1234 5678"
          defaultValue={catalog.whatsapp ?? ""}
        />
        <FieldHint>
          Aparece como botón de contacto en el catálogo.
        </FieldHint>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={500}
          placeholder="Mayoreo de abarrotes · Entregas en CDMX"
          defaultValue={catalog.description ?? ""}
        />
      </div>

      {/* Branding: estos dos campos ya se mostraban en el catálogo público,
          pero no existían en el panel, así que eran inalcanzables. */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="t-label mb-2 text-muted-foreground">Imágenes de marca</legend>
        <div>
          <Label htmlFor="logo_url">URL del logo</Label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            placeholder="https://…/logo.png"
            defaultValue={catalog.logo_url ?? ""}
          />
          <FieldHint>
            Cuadrado. Si lo dejas vacío se usa la inicial del nombre.
          </FieldHint>
        </div>
        <div>
          <Label htmlFor="banner_url">URL del banner</Label>
          <Input
            id="banner_url"
            name="banner_url"
            type="url"
            placeholder="https://…/banner.jpg"
            defaultValue={catalog.banner_url ?? ""}
          />
          <FieldHint>
            Formato 3:1. También se usa como imagen al compartir el enlace.
          </FieldHint>
        </div>
      </fieldset>

      <fieldset>
        <legend className="t-label mb-2 text-muted-foreground">
          Apariencia del catálogo
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-theme-sm)] border border-border p-2 hover:bg-muted has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring">
            <input
              type="radio"
              name="theme"
              value=""
              defaultChecked={currentTheme === ""}
              className="sr-only"
            />
            <ThemeSwatchInherit />
            <span className="t-label text-[0.5625rem]">Heredar</span>
          </label>
          {THEMES.map((t) => (
            <label
              key={t.id}
              title={t.description}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-theme-sm)] border border-border p-2 hover:bg-muted has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring"
            >
              <input
                type="radio"
                name="theme"
                value={t.id}
                defaultChecked={currentTheme === t.id}
                className="sr-only"
              />
              <ThemeSwatch theme={t} />
              <span className="t-label text-[0.5625rem]">{t.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Publicación: antes era una casilla neutra; ahora el estado y sus
          consecuencias se leen de un vistazo. */}
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-[var(--radius-theme-sm)] border p-3 text-sm transition-colors",
          isPublic ? "border-primary bg-primary/5" : "border-border bg-muted",
        )}
      >
        <input
          type="checkbox"
          name="is_public"
          value="true"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-semibold">
            {isPublic ? (
              <>
                <Globe className="size-4 text-primary" aria-hidden="true" /> Catálogo publicado
              </>
            ) : (
              <>
                <Lock className="size-4" aria-hidden="true" /> Borrador (privado)
              </>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {isPublic
              ? "Cualquiera con el enlace puede verlo y hacer pedidos."
              : "Nadie puede abrirlo todavía, ni con el enlace."}
          </span>
          {isPublic && productCount === 0 && (
            <span className="mt-1 block text-xs font-medium text-accent">
              Atención: este catálogo no tiene productos asignados.
            </span>
          )}
        </span>
      </label>

      {state.error && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Guardar cambios
      </Button>
    </form>
  );
}

export function DeleteCatalogButton({ id, name }: { id: string; name: string }) {
  const confirm = useConfirm();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    const ok = await confirm({
      title: `¿Eliminar el catálogo "${name}"?`,
      description:
        "El enlace y el QR dejarán de funcionar de inmediato. Tus productos y pedidos no se borran.",
      confirmLabel: "Eliminar catálogo",
    });
    if (!ok) return;

    setDeleting(true);
    const fd = new FormData();
    fd.set("id", id);
    try {
      await deleteCatalog(fd);
    } catch {
      // `deleteCatalog` termina con un redirect, que en Next se propaga como
      // excepción: sólo avisamos si falla de verdad al volver aquí.
      setDeleting(false);
      toast("No se pudo eliminar el catálogo.", { tone: "error" });
    }
  }

  return (
    <Button type="button" variant="destructive" onClick={remove} disabled={deleting} className="gap-2">
      {deleting ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
      Eliminar catálogo
    </Button>
  );
}
