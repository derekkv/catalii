"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createCatalog, type CatalogState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

const initial: CatalogState = { ok: false };

export function CatalogCreateForm() {
  const [state, action, pending] = useActionState(createCatalog, initial);
  const [name, setName] = useState("");
  const slug = slugify(name);

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="cat-name">Nombre del catálogo</Label>
          <Input
            id="cat-name"
            name="name"
            required
            maxLength={120}
            placeholder="Catálogo general 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          Crear catálogo
        </Button>
      </div>

      {/* El slug se deriva del nombre; mostrarlo antes evita la sorpresa de
          descubrir la URL definitiva después de crearlo. */}
      <p className="text-xs text-muted-foreground">
        {slug ? (
          <>
            Enlace: <span className="font-mono">/c/{slug}</span> · se crea como borrador y lo
            publicas cuando quieras.
          </>
        ) : (
          "Se crea como borrador: nadie podrá verlo hasta que lo publiques."
        )}
      </p>

      {state.error && (
        <p
          role="alert"
          className="rounded-[var(--radius-theme-sm)] bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
