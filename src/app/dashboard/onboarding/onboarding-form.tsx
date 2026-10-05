"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { createBusiness, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { THEMES } from "@/lib/themes";
import { slugify } from "@/lib/utils";

const initial: FormState = { ok: false };

export function OnboardingForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(createBusiness, initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState("vibrant");

  // El identificador sigue al nombre mientras no se toque a mano. Antes el
  // campo era libre y la vista previa seguía mostrando el slug del nombre,
  // así que no coincidía con lo que se iba a guardar.
  const effectiveSlug = slugify(slug || name) || "mi-negocio";

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="name">Nombre del negocio *</Label>
        <Input
          id="name"
          name="name"
          required
          autoFocus
          maxLength={120}
          placeholder="Distribuidora El Sol"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Es el nombre que verán tus clientes.
        </p>
      </div>

      <div>
        <Label htmlFor="slug">Identificador (opcional)</Label>
        <Input
          id="slug"
          name="slug"
          maxLength={60}
          placeholder={slugify(name) || "mi-negocio"}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={(e) => setSlug(slugify(e.target.value))}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Aparecerá en tus enlaces: <span className="font-mono">/c/{effectiveSlug}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            placeholder="+52 55 1234 5678"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Por aquí te escribirán tus clientes.
          </p>
        </div>
        <div>
          <Label htmlFor="email">Correo de contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultEmail} />
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Apariencia inicial</legend>
        <p className="mb-2 text-xs text-muted-foreground">
          Puedes cambiarla después, y cada catálogo puede tener la suya.
        </p>
        <input type="hidden" name="theme" value={theme} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              title={t.description}
              className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-theme-sm)] border p-2 transition-colors ${
                theme === t.id ? "border-primary ring-2 ring-ring" : "border-border hover:bg-muted"
              }`}
            >
              <span
                className="size-6 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${t.swatch.primary}, ${t.swatch.accent})`,
                }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p
          role="alert"
          className="rounded-[var(--radius-theme-sm)] bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Crear mi negocio
      </Button>
    </form>
  );
}
