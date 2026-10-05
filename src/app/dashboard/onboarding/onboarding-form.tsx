"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { createBusiness, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/input";
import { ThemeSwatch } from "@/components/theme/theme-swatch";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";
import { slugify } from "@/lib/utils";

const initial: FormState = { ok: false };

export function OnboardingForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(createBusiness, initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState(DEFAULT_THEME);

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
        <FieldHint>
          Es el nombre que verán tus clientes.
        </FieldHint>
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
        <FieldHint>
          Aparecerá en tus enlaces: <span className="font-mono">/c/{effectiveSlug}</span>
        </FieldHint>
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
          <FieldHint>
            Por aquí te escribirán tus clientes.
          </FieldHint>
        </div>
        <div>
          <Label htmlFor="email">Correo de contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultEmail} />
        </div>
      </div>

      <fieldset>
        <legend className="t-label mb-1 text-muted-foreground">Apariencia inicial</legend>
        <FieldHint>
          Puedes cambiarla después, y cada catálogo puede tener la suya.
        </FieldHint>
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
              <ThemeSwatch theme={t} />
              <span className="t-label text-[0.5625rem]">{t.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {state.error && <FieldError>{state.error}</FieldError>}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Crear mi negocio
      </Button>
    </form>
  );
}
