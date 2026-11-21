"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateBusiness, type SettingsState } from "./actions";
import { BusinessBrandImages } from "./brand-images";
import { FormSection, TextField, TextAreaField } from "./form-fields";
import { PublishSection } from "./publish-section";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ThemeSwatch } from "@/components/theme/theme-swatch";
import { THEMES, resolveTheme } from "@/lib/themes";
import { slugify } from "@/lib/utils";
import type { Business } from "@/types/database";

const initial: SettingsState = { ok: false };

/**
 * Ajustes del negocio: todo el perfil en un solo formulario, por secciones.
 *
 * Un único envío (y no un formulario por bloque) porque el nombre, el enlace y
 * la publicación se revisan juntos: publicar con el enlace equivocado es el
 * error que hay que evitar, y partirlo en cinco guardados lo hace más fácil.
 * El logo y el banner son la excepción: se suben a R2 y se guardan solos.
 */
export function SettingsForm({
  business,
  siteUrl,
  activeProducts,
  publicCatalogs,
}: {
  business: Business;
  siteUrl: string;
  activeProducts: number;
  publicCatalogs: number;
}) {
  // Se normaliza el theme guardado: si viene de la versión anterior del
  // sistema de diseño, ningún radio quedaría marcado y el formulario se
  // enviaría sin theme, haciendo fallar la validación del enum.
  const currentTheme = resolveTheme(business.theme);
  const router = useRouter();
  const { toast } = useToast();

  const [slug, setSlug] = useState(business.slug);
  const [isPublic, setIsPublic] = useState(business.is_public);
  const [showProducts, setShowProducts] = useState(business.show_products);

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

  const fields = state.fields ?? {};

  return (
    <form action={action} className="space-y-6">
      <FormSection
        id="identidad"
        title="Identidad"
        description="El nombre, la dirección de tu página y cómo se presenta tu negocio."
        visibility="public"
        // La primera sección no lleva regla superior: ya la pone la cabecera
        // de la página.
        divider={false}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="name"
            label="Nombre del negocio *"
            required
            maxLength={120}
            defaultValue={business.name}
            error={fields.name}
          />
          <TextField
            id="category"
            label="Rubro"
            maxLength={80}
            placeholder="Abarrotes al por mayor"
            defaultValue={business.category ?? ""}
            error={fields.category}
            hint="Qué vendes, en dos o tres palabras."
          />
        </div>

        <TextField
          id="slug"
          label="Enlace de tu página *"
          required
          maxLength={60}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={(e) => setSlug(slugify(e.target.value))}
          error={fields.slug}
          hint={
            <>
              Tu página será{" "}
              <span className="font-mono">
                {siteUrl}/n/{slugify(slug) || "…"}
              </span>
            </>
          }
        />
        {slugify(slug) !== business.slug && business.is_public && (
          <p className="-mt-2 text-xs font-medium text-accent">
            Al cambiar el enlace, los links de tu página que ya compartiste dejarán de funcionar.
          </p>
        )}

        <TextField
          id="tagline"
          label="Frase corta"
          maxLength={160}
          placeholder="Distribuidora de abarrotes desde 1998"
          defaultValue={business.tagline ?? ""}
          error={fields.tagline}
          hint="Aparece justo debajo del nombre."
        />

        <TextAreaField
          id="description"
          label="Descripción"
          maxLength={2000}
          rows={5}
          placeholder="A qué se dedica tu negocio, a quién le vendes, condiciones al por mayor, zonas de entrega…"
          defaultValue={business.description ?? ""}
          error={fields.description}
          hint="El texto largo de tu página. Puedes escribir varios párrafos."
        />

        {/* Logo y banner no dependen del botón de guardar: se suben a R2 y se
            asocian al momento con su propia acción. Conviene decirlo, porque
            rompen la expectativa del resto del formulario. */}
        <div className="space-y-4">
          <FieldHint className="mt-0">
            El logo y el banner se guardan en cuanto los subes, sin esperar a «Guardar cambios».
          </FieldHint>
          <BusinessBrandImages business={business} />
        </div>

        <fieldset>
          <legend className="t-label mb-2 text-muted-foreground">Apariencia</legend>
          <FieldHint>
            Se usa en tu página y en los catálogos que no tengan la suya propia.
          </FieldHint>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
      </FormSection>

      <FormSection
        id="contacto"
        title="Contacto"
        description="El correo es sólo para avisos de tu cuenta y no se publica. El teléfono, el sitio web y tus redes sí aparecen en tu página."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="whatsapp"
            label="WhatsApp de pedidos"
            type="tel"
            inputMode="tel"
            maxLength={25}
            placeholder="+593 99 123 4567"
            defaultValue={business.whatsapp ?? ""}
            error={fields.whatsapp}
            hint="Es el número que heredan los catálogos nuevos, y el del botón de WhatsApp de tu página."
          />
          <TextField
            id="email"
            label="Correo de contacto"
            type="email"
            maxLength={160}
            defaultValue={business.email ?? ""}
            error={fields.email}
            hint="Para avisos de tu cuenta. No se publica."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="phone"
            label="Teléfono"
            type="tel"
            inputMode="tel"
            maxLength={25}
            placeholder="+593 4 123 4567"
            defaultValue={business.phone ?? ""}
            error={fields.phone}
            hint="Este sí se muestra en tu página."
          />
          <TextField
            id="website"
            label="Sitio web"
            type="url"
            inputMode="url"
            maxLength={300}
            placeholder="https://minegocio.com"
            defaultValue={business.website ?? ""}
            error={fields.website}
            hint="Con https:// al inicio."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="instagram"
            label="Instagram"
            maxLength={120}
            placeholder="minegocio"
            autoCapitalize="off"
            spellCheck={false}
            defaultValue={business.instagram ?? ""}
            error={fields.instagram}
            hint="Sólo el usuario. Si pegas el enlace completo, lo recortamos."
          />
          <TextField
            id="facebook"
            label="Facebook"
            maxLength={120}
            placeholder="minegocio"
            autoCapitalize="off"
            spellCheck={false}
            defaultValue={business.facebook ?? ""}
            error={fields.facebook}
            hint="El usuario o el nombre de tu página."
          />
        </div>
      </FormSection>

      <FormSection
        id="ubicacion"
        title="Ubicación y horario"
        description="Para que un comprador sepa si puede llegar a tu bodega y cuándo."
        visibility="public"
      >
        <TextField
          id="address"
          label="Dirección"
          maxLength={240}
          placeholder="Av. Central 123, Bodega 4"
          defaultValue={business.address ?? ""}
          error={fields.address}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="city"
            label="Ciudad"
            maxLength={120}
            placeholder="Guayaquil"
            defaultValue={business.city ?? ""}
            error={fields.city}
          />
          <TextField
            id="country"
            label="País"
            maxLength={80}
            placeholder="Ecuador"
            defaultValue={business.country ?? ""}
            error={fields.country}
          />
        </div>
        <TextAreaField
          id="hours"
          label="Horario"
          maxLength={300}
          rows={2}
          placeholder="Lun a Vie 9:00-18:00 · Sáb 9:00-13:00"
          defaultValue={business.hours ?? ""}
          error={fields.hours}
          hint="Escríbelo como se lo dirías a un cliente."
        />
      </FormSection>

      <PublishSection
        publicUrl={`${siteUrl}/n/${business.slug}`}
        savedIsPublic={business.is_public}
        isPublic={isPublic}
        onIsPublicChange={setIsPublic}
        showProducts={showProducts}
        onShowProductsChange={setShowProducts}
        activeProducts={activeProducts}
        publicCatalogs={publicCatalogs}
        slugChanged={slugify(slug) !== business.slug}
      />

      {/* Resumen de error: el detalle ya está junto a cada campo, esto es para
          quien envía con el formulario desplazado fuera de pantalla. */}
      {state.error && <FieldError>{state.error}</FieldError>}

      <div className="rule-t pt-6">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
