"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { productSchema, productImagesSchema } from "@/lib/validation";
import { getPlan } from "@/lib/plans";
import { assertUploadedKey, deleteMedia } from "@/lib/media/server";
import type { StoredImage } from "@/types/database";

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

/**
 * Lee y valida las imágenes del formulario.
 *
 * `previous` son las que ya tenía el producto: esas no se vuelven a comprobar
 * en R2. Las nuevas deben ser del negocio y existir en el bucket, para que
 * nadie pueda asociar claves inventadas o de otro negocio.
 */
async function readImages(
  formData: FormData,
  businessId: string,
  previous: StoredImage[] = [],
): Promise<{ images: StoredImage[] } | { error: string }> {
  const raw = formData.get("images");
  if (raw === null || raw === "") return { images: [] };
  let json: unknown;
  try {
    json = JSON.parse(String(raw));
  } catch {
    return { error: "Imágenes inválidas." };
  }
  const parsed = productImagesSchema.safeParse(json);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Imágenes inválidas." };

  const known = new Set(previous.map((i) => i.key));
  const checks = await Promise.all(
    parsed.data.map((img) =>
      known.has(img.key) ? true : assertUploadedKey(img.key, businessId, "product").catch(() => false),
    ),
  );
  if (checks.some((ok) => !ok)) {
    return { error: "Alguna foto no terminó de subirse. Quítala y vuelve a intentarlo." };
  }
  return { images: parsed.data };
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

  const imgs = await readImages(formData, business.id);
  if ("error" in imgs) return fail(imgs.error);

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
    images: imgs.images,
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

  const { data: current } = await supabase
    .from("product")
    .select("images")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!current) return fail("Producto no encontrado.");
  const previous = ((current as { images: StoredImage[] | null }).images ?? []) as StoredImage[];

  const imgs = await readImages(formData, business.id, previous);
  if ("error" in imgs) return fail(imgs.error);

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
      images: imgs.images,
      active: p.active,
    })
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return fail("No se pudo actualizar.");

  // Solo tras guardar: las fotos quitadas se borran de R2.
  const kept = new Set(imgs.images.map((i) => i.key));
  await deleteMedia(previous.filter((i) => !kept.has(i.key)).map((i) => i.key));

  revalidatePath("/dashboard/productos");
  return ok("Producto actualizado.");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const business = await getBusiness();
  if (!business) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: removed } = await supabase
    .from("product")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)
    .select("images");
  const keys = ((removed ?? []) as { images: StoredImage[] | null }[]).flatMap((r) =>
    (r.images ?? []).map((i) => i.key),
  );
  await deleteMedia(keys);
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
