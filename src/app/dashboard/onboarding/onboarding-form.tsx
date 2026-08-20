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
  const [theme, setTheme] = useState("vibrant");
  const slugPreview = slugify(name || "mi-negocio");

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="name">Nombre del negocio</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          placeholder="Distribuidora El Sol"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Tu catálogo vivirá en <span className="font-mono">/c/{slugPreview}</span>
        </p>
      </div>

      <div>
        <Label htmlFor="slug">Identificador (opcional)</Label>
        <Input id="slug" name="slug" maxLength={60} placeholder={slugPreview} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" inputMode="tel" placeholder="+52 55 1234 5678" />
        </div>
        <div>
          <Label htmlFor="email">Correo de contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultEmail} />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Apariencia inicial</legend>
        <input type="hidden" name="theme" value={theme} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              title={t.name}
              className={`flex flex-col items-center gap-1 rounded-[var(--radius-theme-sm)] border p-2 transition-colors ${
                theme === t.id ? "border-primary ring-2 ring-ring" : "border-border hover:bg-muted"
              }`}
            >
              <span
                className="size-6 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.swatch.primary}, ${t.swatch.accent})` }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Crear mi negocio
      </Button>
    </form>
  );
}
