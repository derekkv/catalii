"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  parseBusinessForm,
  businessProfileColumns,
  type BusinessFieldErrors,
} from "../configuracion/business-form";

export interface FormState {
  ok: boolean;
  error?: string;
  /** Mensaje por campo, para pintarlo junto al input que lo provocó. */
  fields?: BusinessFieldErrors;
}

/**
 * Crea el negocio del usuario.
 *
 * Valida con el mismo parser que los ajustes (`configuracion/business-form`):
 * son los mismos campos pedidos en otro momento, y así un dato aceptado aquí
 * no es rechazado allá ni al contrario.
 *
 * `is_public` y `show_products` NO se envían: la página nace despublicada y
 * mostrando productos, que es lo que ponen los `default` de la migración 0009.
 * El formulario de registro no ofrece publicar porque en ese momento no hay
 * productos, ni logo, ni nada que mirar.
 */
export async function createBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a iniciar sesión." };

  const parsed = parseBusinessForm(formData, { email: user.email ?? "" });
  if (!parsed.ok) return { ok: false, error: parsed.error, fields: parsed.fields };
  const { basic, profile } = parsed.values;

  // Evita crear dos negocios para el mismo usuario.
  const { data: existing } = await supabase
    .from("business")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  const { error } = await supabase.from("business").insert({
    owner_id: user.id,
    name: basic.name,
    slug: basic.slug,
    whatsapp: basic.whatsapp || null,
    email: basic.email || null,
    theme: basic.theme,
    ...businessProfileColumns(profile),
  });

  if (error) {
    console.error("[createBusiness]", error.code, error.message);
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ese identificador (slug) ya está en uso. Prueba otro.",
        fields: { slug: "Ese identificador ya está en uso. Prueba otro." },
      };
    }
    // La migración 0009 añade las columnas del perfil; si no se aplicó,
    // PostgREST rechaza el insert por columna desconocida.
    if (error.code === "PGRST204" || error.code === "42703") {
      return {
        ok: false,
        error: "Falta aplicar la migración 0009 en la base de datos. No se creó nada.",
      };
    }
    return { ok: false, error: "No se pudo crear el negocio. Intenta de nuevo." };
  }

  redirect("/dashboard");
}
