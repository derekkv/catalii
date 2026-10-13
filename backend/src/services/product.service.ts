import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/errors.js";
import { limitsFor } from "@/config/plans.js";
import type { Business, Product } from "@/types/database.js";
import type { CreateProductInput, UpdateProductInput } from "@/schemas/product.schema.js";

/**
 * Capa de datos de productos. Recibe el cliente del usuario (RLS activa), así
 * que la cláusula business_id es defensa en profundidad, no la única barrera.
 */
export const productService = {
  async list(db: SupabaseClient, businessId: string): Promise<Product[]> {
    const { data, error } = await db
      .from("product")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(502, "No se pudieron cargar los productos.", "db_error");
    return (data ?? []) as Product[];
  },

  async get(db: SupabaseClient, businessId: string, id: string): Promise<Product> {
    const { data, error } = await db
      .from("product")
      .select("*")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) throw new ApiError(502, "No se pudo cargar el producto.", "db_error");
    if (!data) throw ApiError.notFound("Producto no encontrado.");
    return data as Product;
  },

  async create(db: SupabaseClient, business: Business, input: CreateProductInput): Promise<Product> {
    const { count } = await db
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);

    const max = limitsFor(business.plan).maxProducts;
    if ((count ?? 0) >= max) {
      throw ApiError.conflict(`Alcanzaste el límite de ${max} productos de tu plan.`);
    }

    const { data, error } = await db
      .from("product")
      .insert({ ...input, business_id: business.id })
      .select("*")
      .single();
    if (error) throw new ApiError(502, "No se pudo guardar el producto.", "db_error");
    return data as Product;
  },

  async update(
    db: SupabaseClient,
    businessId: string,
    id: string,
    patch: UpdateProductInput,
  ): Promise<Product> {
    const { data, error } = await db
      .from("product")
      .update(patch)
      .eq("id", id)
      .eq("business_id", businessId)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError(502, "No se pudo actualizar.", "db_error");
    if (!data) throw ApiError.notFound("Producto no encontrado.");
    return data as Product;
  },

  async remove(db: SupabaseClient, businessId: string, id: string): Promise<void> {
    const { error } = await db
      .from("product")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) throw new ApiError(502, "No se pudo borrar.", "db_error");
  },
};
