"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createCatalog, type CatalogState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initial: CatalogState = { ok: false };

export function CatalogCreateForm() {
  const [state, action, pending] = useActionState(createCatalog, initial);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="cat-name">Nombre del catálogo</Label>
        <Input id="cat-name" name="name" required maxLength={120} placeholder="Catálogo general 2026" />
      </div>
      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        Crear catálogo
      </Button>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive sm:self-center">
          {state.error}
        </p>
      )}
    </form>
  );
}
