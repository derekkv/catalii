"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { businessSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { resolveTheme } from "@/lib/themes";

export interface FormState {
  ok: boolean;
  error?: string;
}

export async function createBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a iniciar sesión." };

  const rawSlug = String(formData.get("slug") ?? "");
  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    slug: rawSlug ? slugify(rawSlug) : slugify(String(formData.get("name") ?? "")),
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? user.email ?? "",
    // `resolveTheme` en lugar de un id escrito a mano: si el registro de
    // themes cambia, esto no se queda apuntando a uno que ya no existe (y que
    // haría fallar la validación del enum).
    theme: resolveTheme(String(formData.get("theme") ?? "")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Evita crear dos negocios para el mismo usuario.
  const { data: existing } = await supabase
    .from("business")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  const { error } = await supabase.from("business").insert({
    owner_id: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    theme: parsed.data.theme,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ese identificador (slug) ya está en uso. Prueba otro." };
    }
    return { ok: false, error: "No se pudo crear el negocio. Intenta de nuevo." };
  }

  redirect("/dashboard");
}
