"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { businessSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

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
