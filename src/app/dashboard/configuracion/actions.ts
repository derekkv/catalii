"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { businessSchema, brandImageKeySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { assertUploadedKey, deleteMedia } from "@/lib/media/server";

export interface SettingsState {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function updateBusiness(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    slug: slugify(String(formData.get("slug") || business.slug)),
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? "",
    theme: formData.get("theme") ?? business.theme,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const b = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("business")
    .update({
      name: b.name,
      slug: b.slug,
      whatsapp: b.whatsapp || null,
      email: b.email || null,
      theme: b.theme,
    })
    .eq("id", business.id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ese identificador ya está en uso." };
    return { ok: false, error: "No se pudo guardar." };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard");
  return { ok: true, message: "Cambios guardados." };
}


/**
 * Logo (foto de perfil) o banner por defecto del negocio. Los catálogos que no
 * tengan uno propio heredan estos. `key = null` lo quita.
 */
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
  if (error) return { ok: false, error: "No se pudo guardar la imagen." };

  if (previous && previous !== parsedKey.data) await deleteMedia([previous]);

  // Afecta al shell del panel (avatar) y a los catálogos que heredan.
  revalidatePath("/dashboard", "layout");
  const { data: cats } = await supabase
    .from("catalog")
    .select("slug")
    .eq("business_id", business.id)
    .eq("is_public", true);
  for (const c of cats ?? []) revalidatePath(`/c/${c.slug as string}`);
  return { ok: true };
}
