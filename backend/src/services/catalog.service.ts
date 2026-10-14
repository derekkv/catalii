import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/errors.js";
import { limitsFor } from "@/config/plans.js";
import { publicClient } from "@/lib/supabase.js";
import type { Business, Catalog, Product } from "@/types/database.js";
import type { CreateCatalogInput, UpdateCatalogInput } from "@/schemas/catalog.schema.js";

/** 23505 = unique_violation en Postgres (el slug ya existe). */
function isUniqueViolation(err: { code?: string } | null): boolean {
  return err?.code === "23505";
}

export const catalogService = {
  async list(db: SupabaseClient, businessId: string): Promise<Catalog[]> {
    const { data, error } = await db
      .from("catalog")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(502, "No se pudieron cargar los catálogos.", "db_error");
    return (data ?? []) as Catalog[];
  },

  async create(db: SupabaseClient, business: Business, input: CreateCatalogInput): Promise<Catalog> {
    const { count } = await db
      .from("catalog")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);

    const max = limitsFor(business.plan).maxCatalogs;
    if ((count ?? 0) >= max) {
      throw ApiError.conflict(`Tu plan permite ${max} catálogo(s). Mejora tu plan para más.`);
    }

    const { data, error } = await db
      .from("catalog")
      .insert({
        business_id: business.id,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        display_name: input.display_name ?? input.name,
        whatsapp: input.whatsapp ?? null,
        theme: input.theme ?? null,
        is_public: input.is_public,
      })
      .select("*")
      .single();

    if (isUniqueViolation(error)) throw ApiError.conflict("Ese enlace (slug) ya existe. Elige otro.");
    if (error) throw new ApiError(502, "No se pudo crear el catálogo.", "db_error");
    return data as Catalog;
  },

  async update(
    db: SupabaseClient,
    businessId: string,
    id: string,
    patch: UpdateCatalogInput,
  ): Promise<Catalog> {
    const { data, error } = await db
      .from("catalog")
      .update(patch)
      .eq("id", id)
      .eq("business_id", businessId)
      .select("*")
      .maybeSingle();
    if (isUniqueViolation(error)) throw ApiError.conflict("Ese enlace (slug) ya existe. Elige otro.");
    if (error) throw new ApiError(502, "No se pudo actualizar el catálogo.", "db_error");
    if (!data) throw ApiError.notFound("Catálogo no encontrado.");
    return data as Catalog;
  },

  async remove(db: SupabaseClient, businessId: string, id: string): Promise<void> {
    const { error } = await db
      .from("catalog")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) throw new ApiError(502, "No se pudo borrar el catálogo.", "db_error");
  },

  /**
   * Vista pública del catálogo (sin sesión). Devuelve el catálogo y sus
   * productos activos, en el orden definido. Solo si el catálogo es público:
   * eso lo garantiza RLS vía el cliente anónimo.
   */
  async storefront(slug: string): Promise<{ catalog: Catalog; products: Product[] }> {
    const db = publicClient();

    const { data: catalog, error } = await db
      .from("catalog")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new ApiError(502, "No se pudo cargar el catálogo.", "db_error");
    if (!catalog) throw ApiError.notFound("Catálogo no encontrado o no público.");

    const { data: links } = await db
      .from("catalog_product")
      .select("product_id, sort_order")
      .eq("catalog_id", (catalog as Catalog).id)
      .order("sort_order", { ascending: true });

    const ids = (links ?? []).map((l) => (l as { product_id: string }).product_id);
    let products: Product[] = [];
    if (ids.length) {
      const { data: rows } = await db
        .from("product")
        .select("*")
        .in("id", ids)
        .eq("active", true);
      const byId = new Map((rows ?? []).map((p) => [(p as Product).id, p as Product]));
      // Respeta el orden de catalog_product.
      products = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
    }

    return { catalog: catalog as Catalog, products };
  },
};
