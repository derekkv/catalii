"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { catalogSchema } from "@/lib/validation";
import { getPlan } from "@/lib/plans";
import { slugify } from "@/lib/utils";

export interface CatalogState {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function createCatalog(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  const supabase = await createClient();

  const { count } = await supabase
    .from("catalog")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  const limit = getPlan(business.plan).limits.maxCatalogs;
  if ((count ?? 0) >= limit) {
    return { ok: false, error: `Tu plan permite ${limit} catálogo(s). Mejora tu plan para más.` };
  }

  const name = String(formData.get("name") ?? "");
  const parsed = catalogSchema.safeParse({
    name,
    slug: slugify(String(formData.get("slug") || name)),
    description: formData.get("description") ?? "",
    display_name: formData.get("display_name") ?? name,
    whatsapp: formData.get("whatsapp") ?? business.whatsapp ?? "",
    theme: formData.get("theme") ?? "",
    is_public: formData.get("is_public") ?? false,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const c = parsed.data;

  const { data: created, error } = await supabase
    .from("catalog")
    .insert({
      business_id: business.id,
      name: c.name,
      slug: c.slug,
      description: c.description || null,
      display_name: c.display_name || c.name,
      whatsapp: c.whatsapp || null,
      theme: c.theme || null,
      is_public: false,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ese enlace (slug) ya existe. Elige otro." };
    return { ok: false, error: "No se pudo crear el catálogo." };
  }

  revalidatePath("/dashboard/catalogos");
  redirect(`/dashboard/catalogos/${created!.id}`);
}

export async function updateCatalog(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Catálogo inválido." };

  const name = String(formData.get("name") ?? "");
  const parsed = catalogSchema.safeParse({
    name,
    slug: slugify(String(formData.get("slug") || name)),
    description: formData.get("description") ?? "",
    display_name: formData.get("display_name") ?? name,
    whatsapp: formData.get("whatsapp") ?? "",
    theme: formData.get("theme") ?? "",
    is_public: formData.get("is_public") ?? false,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const c = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog")
    .update({
      name: c.name,
      slug: c.slug,
      description: c.description || null,
      display_name: c.display_name || c.name,
      whatsapp: c.whatsapp || null,
      theme: c.theme || null,
      is_public: c.is_public,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ese enlace (slug) ya existe. Elige otro." };
    return { ok: false, error: "No se pudo actualizar el catálogo." };
  }

  revalidatePath("/dashboard/catalogos");
  revalidatePath(`/dashboard/catalogos/${id}`);
  return { ok: true, message: "Catálogo actualizado." };
}

export async function deleteCatalog(formData: FormData): Promise<void> {
  const business = await getBusiness();
  if (!business) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("catalog").delete().eq("id", id).eq("business_id", business.id);
  revalidatePath("/dashboard/catalogos");
  redirect("/dashboard/catalogos");
}

/** Sincroniza qué productos pertenecen al catálogo (set completo). */
export async function syncCatalogProducts(formData: FormData): Promise<void> {
  const business = await getBusiness();
  if (!business) return;
  const catalogId = String(formData.get("catalog_id") ?? "");
  if (!catalogId) return;
  const ids = formData.getAll("product_ids").map(String).filter(Boolean);

  const supabase = await createClient();

  // Verifica propiedad del catálogo (defensa en profundidad; RLS ya protege).
  const { data: cat } = await supabase
    .from("catalog")
    .select("id")
    .eq("id", catalogId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!cat) return;

  // Valida que los productos pertenezcan al negocio.
  const { data: owned } = await supabase
    .from("product")
    .select("id")
    .eq("business_id", business.id)
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const validIds = new Set((owned ?? []).map((p) => p.id));

  await supabase.from("catalog_product").delete().eq("catalog_id", catalogId);
  const rows = ids
    .filter((id) => validIds.has(id))
    .map((product_id, i) => ({ catalog_id: catalogId, product_id, sort_order: i }));
  if (rows.length) await supabase.from("catalog_product").insert(rows);

  revalidatePath(`/dashboard/catalogos/${catalogId}`);
}
