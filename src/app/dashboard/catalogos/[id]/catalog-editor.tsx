"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { updateCatalog, deleteCatalog, type CatalogState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { THEMES } from "@/lib/themes";
import type { Catalog } from "@/types/database";

const initial: CatalogState = { ok: false };

export function CatalogConfigForm({ catalog }: { catalog: Catalog }) {
  const [state, action, pending] = useActionState(updateCatalog, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={catalog.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre interno</Label>
          <Input id="name" name="name" required maxLength={120} defaultValue={catalog.name} />
        </div>
        <div>
          <Label htmlFor="slug">Enlace (slug)</Label>
          <Input id="slug" name="slug" required defaultValue={catalog.slug} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <Label htmlFor="whatsapp">WhatsApp de pedidos</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={catalog.whatsapp ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" maxLength={500} defaultValue={catalog.description ?? ""} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Apariencia del catálogo</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-theme-sm)] border border-border p-2 hover:bg-muted has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring">
            <input
              type="radio"
              name="theme"
              value=""
              defaultChecked={!catalog.theme}
              className="sr-only"
            />
            <span className="size-6 rounded-full border border-border bg-muted" aria-hidden="true" />
            <span className="text-[10px] font-medium">Heredar</span>
          </label>
          {THEMES.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-theme-sm)] border border-border p-2 hover:bg-muted has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring"
            >
              <input
                type="radio"
                name="theme"
                value={t.id}
                defaultChecked={catalog.theme === t.id}
                className="sr-only"
              />
              <span
                className="size-6 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.swatch.primary}, ${t.swatch.accent})` }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium">{t.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 rounded-[var(--radius-theme-sm)] bg-muted p-3 text-sm font-medium">
        <input
          type="checkbox"
          name="is_public"
          value="true"
          defaultChecked={catalog.is_public}
          className="size-4 accent-[var(--primary)]"
        />
        Publicar catálogo (visible para cualquiera con el enlace)
      </label>

      {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      {state.ok && state.message && <p className="text-sm text-primary">{state.message}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}

export function DeleteCatalogButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={async (fd) => {
        if (!confirm(`¿Eliminar el catálogo "${name}"?`)) return;
        await deleteCatalog(fd);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" className="gap-2">
        <Trash2 className="size-4" aria-hidden="true" /> Eliminar catálogo
      </Button>
    </form>
  );
}
