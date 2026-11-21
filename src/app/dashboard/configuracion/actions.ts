"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { brandImageKeySchema } from "@/lib/validation";
import { assertUploadedKey, deleteMedia } from "@/lib/media/server";
import {
  parseBusinessForm,
  businessProfileColumns,
  type BusinessFieldErrors,
} from "./business-form";

export interface SettingsState {
  ok: boolean;
  error?: string;
  message?: string;
  /** Mensaje por campo, para pintarlo junto al input que lo provocó. */
  fields?: BusinessFieldErrors;
}

/**
 * Invalida las páginas que muestran datos del negocio.
 *
 * La página pública (`/n/<slug>`) es la que más se olvida: el panel se ve
 * actualizado y el cliente sigue leyendo los datos viejos. Si el enlace
 * cambió, hay que invalidar también el anterior.
 */
function revalidateBusiness(slug: string, previousSlug?: string | null): void {
  revalidatePath("/dashboard/configuracion");
  // El layout del panel pinta el nombre y el logo del negocio.
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/n/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/n/${previousSlug}`);
}

export async function updateBusiness(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };

  const parsed = parseBusinessForm(formData, {
    slug: business.slug,
    theme: business.theme,
  });
  if (!parsed.ok) return { ok: false, error: parsed.error, fields: parsed.fields };
  const { basic, profile } = parsed.values;

  const supabase = await createClient();
  const { error } = await supabase
    .from("business")
    .update({
      name: basic.name,
      slug: basic.slug,
      whatsapp: basic.whatsapp || null,
      email: basic.email || null,
      theme: basic.theme,
      ...businessProfileColumns(profile),
      is_public: profile.is_public,
      show_products: profile.show_products,
    })
    .eq("id", business.id);

  if (error) {
    console.error("[updateBusiness]", error.code, error.message);
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ese enlace ya está en uso. Prueba otro.",
        fields: { slug: "Ese enlace ya está en uso. Prueba otro." },
      };
    }
    // PGRST204 / 42703: PostgREST no reconoce una columna. Pasa si la
    // migración 0009 (perfil público del negocio) todavía no se aplicó.
    if (error.code === "PGRST204" || error.code === "42703") {
      return {
        ok: false,
        error: "Falta aplicar la migración 0009 en la base de datos. No se guardó nada.",
      };
    }
    // Un check de la migración que el formulario no haya cubierto.
    if (error.code === "23514") {
      return { ok: false, error: "Alguno de los datos no tiene el formato esperado." };
    }
    return { ok: false, error: "No se pudo guardar. Vuelve a intentarlo." };
  }

  revalidateBusiness(basic.slug, business.slug);

  const justPublished = profile.is_public && !business.is_public;
  return {
    ok: true,
    message: justPublished
      ? "Listo: tu página de negocio ya es pública."
      : "Cambios guardados.",
  };
}

export async function setBusinessImage(
  kind: "logo" | "banner",
  key: string | null,
): Promise<SettingsState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  if (kind !== "logo" && kind !== "banner") return { ok: false, error: "Tipo inválido." };

  const parsedKey = brandImageKeySchema.safeParse(key);
  if (!parsedKey.success) return { ok: false, error: "Imagen inválida." };
  if (parsedKey.data && !(await assertUploadedKey(parsedKey.data, business.id, kind).catch(() => false))) {
    return { ok: false, error: "La imagen no se subió correctamente. Reintenta." };
  }

  const column = kind === "logo" ? "logo_key" : "banner_key";
  const previous = business[column];

  const supabase = await createClient();
  const update: Record<string, string | null> = { [column]: parsedKey.data };
  if (kind === "logo") update.logo_url = null;
  const { error } = await supabase.from("business").update(update).eq("id", business.id);
  if (error) {
    console.error("[setBusinessImage]", error.code, error.message);
    return { ok: false, error: "No se pudo guardar la imagen." };
  }

  if (previous && previous !== parsedKey.data) await deleteMedia([previous]);

  revalidatePath("/dashboard", "layout");
  // El logo y el banner también encabezan la página pública del negocio.
  revalidatePath(`/n/${business.slug}`);
  const { data: cats } = await supabase
    .from("catalog")
    .select("slug")
    .eq("business_id", business.id)
    .eq("is_public", true);
  for (const c of cats ?? []) revalidatePath(`/c/${c.slug as string}`);
  return { ok: true };
}
