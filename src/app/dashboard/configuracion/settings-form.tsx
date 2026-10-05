"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateBusiness, type SettingsState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ThemeSwatch } from "@/components/theme/theme-swatch";
import { THEMES, resolveTheme } from "@/lib/themes";
import type { Business } from "@/types/database";

const initial: SettingsState = { ok: false };

export function SettingsForm({ business }: { business: Business }) {
  // Se normaliza el theme guardado: si viene de la versión anterior del
  // sistema de diseño, ningún radio quedaría marcado y el formulario se
  // enviaría sin theme, haciendo fallar la validación del enum.
  const currentTheme = resolveTheme(business.theme);
  const router = useRouter();
  const { toast } = useToast();

  const [state, action, pending] = useActionState(
    async (prev: SettingsState, formData: FormData) => {
      const result = await updateBusiness(prev, formData);
      if (result.ok) {
        toast(result.message ?? "Ajustes guardados.", { tone: "success" });
        router.refresh();
      }
      return result;
    },
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre del negocio</Label>
          <Input id="name" name="name" required maxLength={120} defaultValue={business.name} />
        </div>
        <div>
          <Label htmlFor="slug">Identificador</Label>
          <Input id="slug" name="slug" required defaultValue={business.slug} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={business.whatsapp ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">Correo de contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={business.email ?? ""} />
        </div>
      </div>

      <fieldset>
        <legend className="t-label mb-2 text-muted-foreground">
          Apariencia por defecto
        </legend>
        <FieldHint>
          Cada catálogo puede sobrescribirlo desde su propia configuración.
        </FieldHint>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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

      {state.error && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Guardar cambios
      </Button>
    </form>
  );
}
