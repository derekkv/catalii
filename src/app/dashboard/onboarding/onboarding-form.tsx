"use client";

import { useActionState, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { createBusiness, type FormState } from "./actions";
import {
  FormSection,
  TextField,
  TextAreaField,
} from "../configuracion/form-fields";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint } from "@/components/ui/input";
import { ThemeSwatch } from "@/components/theme/theme-swatch";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";
import { slugify } from "@/lib/utils";

const initial: FormState = { ok: false };

/**
 * Registro del negocio: un solo formulario, por secciones.
 *
 * Se descartó partirlo en dos pasos. Un asistente obliga a elegir qué datos
 * son "de paso 1" y qué datos bloquean el paso 2, y cada pantalla intermedia
 * es una oportunidad de abandonar; además habría que guardar el negocio a
 * medias o arrastrar el estado entre pasos. Aquí sólo el nombre es
 * obligatorio: quien tenga prisa escribe una línea y entra, y quien quiera su
 * página lista ya tiene los campos delante, agrupados y marcados como
 * opcionales. Lo que no se suele saber de memoria al registrarse (descripción
 * larga, dirección, redes) queda plegado para no alargar la pantalla.
 */
export function OnboardingForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(createBusiness, initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // El identificador sigue al nombre mientras no se toque a mano. Antes el
  // campo era libre y la vista previa seguía mostrando el slug del nombre,
  // así que no coincidía con lo que se iba a guardar.
  const effectiveSlug = slugify(slug || name) || "mi-negocio";
  const fields = state.fields ?? {};

  return (
    <form action={action} className="space-y-6">
      <FormSection
        id="tu-negocio"
        title="Tu negocio"
        description="Sólo el nombre es obligatorio. El resto puedes dejarlo para después."
        visibility="public"
        divider={false}
      >
        <TextField
          id="name"
          label="Nombre del negocio *"
          required
          autoFocus
          maxLength={120}
          placeholder="Distribuidora El Sol"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fields.name}
          hint="Es el nombre que verán tus clientes."
        />

        <TextField
          id="slug"
          label="Enlace (opcional)"
          maxLength={60}
          placeholder={slugify(name) || "mi-negocio"}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={(e) => setSlug(slugify(e.target.value))}
          error={fields.slug}
          hint={
            <>
              La dirección de tu página: <span className="font-mono">/n/{effectiveSlug}</span>. Si
              lo dejas vacío lo armamos con tu nombre.
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="category"
            label="Rubro"
            maxLength={80}
            placeholder="Abarrotes al mayoreo"
            error={fields.category}
            hint="Qué vendes, en dos o tres palabras."
          />
          <TextField
            id="city"
            label="Ciudad"
            maxLength={120}
            placeholder="Guadalajara"
            error={fields.city}
          />
        </div>

        <TextField
          id="tagline"
          label="Frase corta"
          maxLength={160}
          placeholder="Distribuidora de abarrotes desde 1998"
          error={fields.tagline}
          hint="Aparece debajo del nombre, en tu página y al compartir."
        />
      </FormSection>

      <FormSection
        id="contacto"
        title="Contacto y horario"
        description="El correo es sólo para avisos de tu cuenta; el teléfono y el horario se publican en tu página."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="whatsapp"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            maxLength={25}
            placeholder="+52 55 1234 5678"
            error={fields.whatsapp}
            hint="Por aquí te llegan los pedidos de tus catálogos, y es el botón de WhatsApp de tu página."
          />
          <TextField
            id="phone"
            label="Teléfono"
            type="tel"
            inputMode="tel"
            maxLength={25}
            placeholder="+52 55 1234 5678"
            error={fields.phone}
            hint="El número que se muestra en tu página."
          />
        </div>

        <TextField
          id="email"
          label="Correo de contacto"
          type="email"
          maxLength={160}
          defaultValue={defaultEmail}
          error={fields.email}
          hint="Para avisos de tu cuenta. No se publica."
        />

        <TextAreaField
          id="hours"
          label="Horario"
          maxLength={300}
          rows={2}
          placeholder="Lun a Vie 9:00-18:00 · Sáb 9:00-13:00"
          error={fields.hours}
          hint="Escríbelo como se lo dirías a un cliente."
        />
      </FormSection>

      {/* Plegado: datos que casi nadie tiene a mano al registrarse. Están aquí
          para quien quiera dejar la página lista de una vez, y en Ajustes para
          todos los demás. Se abre solo si el servidor devolvió un error en
          alguno de estos campos, para que el mensaje no quede escondido. */}
      <details
        className="rule-t pt-6"
        open={["description", "address", "country", "website", "instagram", "facebook"].some(
          (f) => fields[f],
        )}
      >
        <summary className="t-label cursor-pointer text-muted-foreground hover:text-foreground">
          Completar ahora el resto de la página (opcional)
        </summary>

        <div className="mt-4 space-y-4">
          <TextAreaField
            id="description"
            label="Descripción"
            maxLength={2000}
            rows={4}
            placeholder="A qué se dedica tu negocio, a quién le vendes, condiciones de mayoreo, zonas de entrega…"
            error={fields.description}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="address"
              label="Dirección"
              maxLength={240}
              placeholder="Av. Central 123, Bodega 4"
              error={fields.address}
            />
            <TextField
              id="country"
              label="País"
              maxLength={80}
              placeholder="México"
              error={fields.country}
            />
          </div>
          <TextField
            id="website"
            label="Sitio web"
            type="url"
            inputMode="url"
            maxLength={300}
            placeholder="https://minegocio.com"
            error={fields.website}
            hint="Con https:// al inicio."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="instagram"
              label="Instagram"
              maxLength={120}
              placeholder="minegocio"
              autoCapitalize="off"
              spellCheck={false}
              error={fields.instagram}
              hint="Sólo el usuario, sin @."
            />
            <TextField
              id="facebook"
              label="Facebook"
              maxLength={120}
              placeholder="minegocio"
              autoCapitalize="off"
              spellCheck={false}
              error={fields.facebook}
              hint="El usuario o el nombre de tu página."
            />
          </div>
        </div>
      </details>

      <fieldset className="rule-t pt-6">
        <legend className="t-label mb-1 text-muted-foreground">Apariencia inicial</legend>
        <FieldHint>Puedes cambiarla después, y cada catálogo puede tener la suya.</FieldHint>
        <input type="hidden" name="theme" value={theme} />
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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

      {/* La página nace privada (default de la migración 0009). Decirlo aquí
          evita la duda de "¿acabo de publicar mis datos?" y deja claro dónde
          se publica cuando esté lista. */}
      <div className="flex items-start gap-3 rounded-[var(--radius-theme-sm)] bg-muted p-4">
        <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm">
          <span className="font-semibold">Tu página empieza privada.</span>{" "}
          <span className="text-muted-foreground">
            Nadie puede abrirla hasta que la publiques desde Ajustes, cuando ya tengas tus
            productos y te guste cómo quedó.
          </span>
        </p>
      </div>

      {state.error && <FieldError>{state.error}</FieldError>}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Crear mi negocio
      </Button>
    </form>
  );
}
