"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { getPlan } from "@/lib/plans";

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

const ok = (message?: string): ActionState => ({ ok: true, message });
const fail = (error: string): ActionState => ({ ok: false, error });

function toCents(value: number): number {
  return Math.round(value * 100);
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const business = await getBusiness();
  if (!business) return fail("No autorizado.");
  const supabase = await createClient();

  // Gating por plan
  const { count } = await supabase
    .from("product")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  const limit = getPlan(business.plan).limits.maxProducts;
  if ((count ?? 0) >= limit) {
    return fail(`Alcanzaste el límite de ${limit} productos de tu plan. Mejora tu plan.`);
  }

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  const p = parsed.data;

  const { error } = await supabase.from("product").insert({
    business_id: business.id,
    name: p.name,
    sku: p.sku || null,
    description: p.description || null,
    category: p.category || null,
    price_cents: toCents(p.price),
    currency: p.currency,
    stock: p.stock,
    min_order_qty: p.min_order_qty,
    image_url: p.image_url || null,
    active: p.active,
  });
  if (error) return fail("No se pudo guardar el producto.");

  revalidatePath("/dashboard/productos");
  return ok("Producto agregado.");
}

export async function updateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const business = await getBusiness();
  if (!business) return fail("No autorizado.");
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Producto inválido.");

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  const p = parsed.data;

  const supabase = await createClient();
  // La cláusula business_id + RLS garantizan que solo edite lo suyo.
  const { error } = await supabase
    .from("product")
    .update({
      name: p.name,
      sku: p.sku || null,
      description: p.description || null,
      category: p.category || null,
      price_cents: toCents(p.price),
      currency: p.currency,
      stock: p.stock,
      min_order_qty: p.min_order_qty,
      image_url: p.image_url || null,
      active: p.active,
    })
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return fail("No se pudo actualizar.");

  revalidatePath("/dashboard/productos");
  return ok("Producto actualizado.");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const business = await getBusiness();
  if (!business) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("product").delete().eq("id", id).eq("business_id", business.id);
  revalidatePath("/dashboard/productos");
}

/** Importación masiva desde CSV. Recalcula límites de plan y valida cada fila. */
export async function importProductsCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const business = await getBusiness();
  if (!business) return fail("No autorizado.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Selecciona un archivo CSV.");
  if (file.size > 2 * 1024 * 1024) return fail("El archivo excede 2 MB.");

  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  if (result.errors.length > 0) return fail("El CSV tiene errores de formato.");

  const supabase = await createClient();
  const { count } = await supabase
    .from("product")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  const limit = getPlan(business.plan).limits.maxProducts;
  const available = Number.isFinite(limit) ? limit - (count ?? 0) : Number.POSITIVE_INFINITY;
  if (available <= 0) return fail("Ya alcanzaste el límite de productos de tu plan.");

  const pick = (row: Record<string, string>, keys: string[]) => {
    for (const k of keys) if (row[k] != null && row[k] !== "") return row[k];
    return "";
  };

  const rows = result.data.slice(0, Math.min(result.data.length, available === Infinity ? 5000 : available));
  const toInsert = [];
  let skipped = 0;
  for (const row of rows) {
    const parsed = productSchema.safeParse({
      name: pick(row, ["name", "nombre", "producto"]),
      sku: pick(row, ["sku", "codigo", "código"]),
      description: pick(row, ["description", "descripcion", "descripción"]),
      category: pick(row, ["category", "categoria", "categoría"]),
      price: pick(row, ["price", "precio"]) || "0",
      currency: pick(row, ["currency", "moneda"]) || "USD",
      stock: pick(row, ["stock", "existencia", "cantidad"]) || "0",
      min_order_qty: pick(row, ["min_order_qty", "minimo", "mínimo"]) || "1",
      image_url: pick(row, ["image_url", "imagen", "image"]),
      active: "true",
    });
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const p = parsed.data;
    toInsert.push({
      business_id: business.id,
      name: p.name,
      sku: p.sku || null,
      description: p.description || null,
      category: p.category || null,
      price_cents: toCents(p.price),
      currency: p.currency,
      stock: p.stock,
      min_order_qty: p.min_order_qty,
      image_url: p.image_url || null,
      active: true,
    });
  }

  if (toInsert.length === 0) return fail("No se encontraron filas válidas en el CSV.");

  const { error } = await supabase.from("product").insert(toInsert);
  if (error) return fail("No se pudieron importar los productos.");

  revalidatePath("/dashboard/productos");
  return ok(`Importados ${toInsert.length} productos${skipped ? `, ${skipped} omitidos` : ""}.`);
}
