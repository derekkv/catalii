"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { backendEnabled, backendFetch } from "@/lib/backend";
import { productSchema, productImagesSchema } from "@/lib/validation";
import { getPlan } from "@/lib/plans";
import { assertUploadedKey, deleteMedia } from "@/lib/media/server";
import { analyzeFile } from "@/lib/import/analyze";
import { readTable } from "@/lib/import/read-file";
import { parseRows, problemsText } from "@/lib/import/mapping";
import { MAX_IMPORT_BYTES, mappingPlanSchema, type Analysis } from "@/lib/import/types";
import type { Product, StoredImage } from "@/types/database";

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

const ok = (message?: string): ActionState => ({ ok: true, message });
const fail = (error: string): ActionState => ({ ok: false, error });

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Slugs de los catálogos **públicos** donde aparece el producto.
 *
 * Una sola consulta, resuelta por el índice `catalog_product_product_idx`
 * (0001_init.sql), y solo en las mutaciones de un producto concreto: no hay
 * ninguna lectura extra en los caminos de lectura ni en la importación masiva.
 * Hace falta porque `/c/[slug]` tiene ISR y sin revalidar a mano el cambio no
 * se ve hasta que caduca la copia.
 */
async function publicCatalogSlugs(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("catalog_product")
    .select("catalog:catalog(slug, is_public)")
    .eq("product_id", productId);
  if (error) {
    // No es motivo para fallar la mutación: solo significa que la página
    // pública tardará lo que dure su ISR en reflejar el cambio.
    console.error("[productos] catálogos del producto:", error.code, error.message);
    return [];
  }
  const rows = (data ?? []) as unknown as { catalog: { slug: string; is_public: boolean } | null }[];
  return Array.from(
    new Set(
      rows
        .map((r) => r.catalog)
        .filter((c): c is { slug: string; is_public: boolean } => Boolean(c?.is_public))
        .map((c) => c.slug),
    ),
  );
}

function revalidatePublicCatalogs(slugs: string[]): void {
  for (const slug of slugs) revalidatePath(`/c/${slug}`);
}

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

type ParsedProduct = ReturnType<typeof productSchema.parse>;

/**
 * Cuerpo JSON que espera la API (`backend/src/schemas/product.schema.ts`).
 * Los textos opcionales vacíos viajan como "" y el backend los guarda como
 * NULL (en PATCH eso es lo que permite vaciar un campo).
 */
function productBody(p: ParsedProduct, images: StoredImage[]) {
  return {
    name: p.name,
    sku: p.sku ?? "",
    description: p.description ?? "",
    category: p.category ?? "",
    price_cents: toCents(p.price),
    currency: p.currency,
    stock: p.stock,
    min_order_qty: p.min_order_qty,
    image_url: p.image_url ?? "",
    images,
    active: p.active,
  };
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const business = await getBusiness();
  if (!business) return fail("No autorizado.");
  const useBackend = backendEnabled();
  const supabase = await createClient();

  // Gating por plan. Con backend lo aplica él (src/config/plans.ts allí).
  if (!useBackend) {
    const { count } = await supabase
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);
    const limit = getPlan(business.plan).limits.maxProducts;
    if ((count ?? 0) >= limit) {
      return fail(`Alcanzaste el límite de ${limit} productos de tu plan. Mejora tu plan.`);
    }
  }

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  const p = parsed.data;

  const imgs = await readImages(formData, business.id);
  if ("error" in imgs) return fail(imgs.error);

  if (useBackend) {
    const res = await backendFetch<Product>("/api/products", {
      method: "POST",
      body: productBody(p, imgs.images),
    });
    if (!res.ok) return fail(res.message);
    revalidatePath("/dashboard/productos");
    // La portada muestra el contador de productos y el setup-checklist.
    revalidatePath("/dashboard");
    return ok("Producto agregado.");
  }

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
  if (error) {
    console.error("[createProduct]", error.code, error.message);
    return fail("No se pudo guardar el producto.");
  }

  revalidatePath("/dashboard/productos");
  // La portada muestra el contador de productos y el setup-checklist.
  revalidatePath("/dashboard");
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

  const useBackend = backendEnabled();
  const supabase = await createClient();

  let previous: StoredImage[];
  if (useBackend) {
    const found = await backendFetch<Product>(`/api/products/${encodeURIComponent(id)}`);
    if (!found.ok) return fail(found.status === 404 ? "Producto no encontrado." : found.message);
    previous = found.data.images ?? [];
  } else {
    const { data: current } = await supabase
      .from("product")
      .select("images")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle();
    if (!current) return fail("Producto no encontrado.");
    previous = ((current as { images: StoredImage[] | null }).images ?? []) as StoredImage[];
  }

  const imgs = await readImages(formData, business.id, previous);
  if ("error" in imgs) return fail(imgs.error);

  if (useBackend) {
    const res = await backendFetch<Product>(`/api/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: productBody(p, imgs.images),
    });
    if (!res.ok) return fail(res.message);

    // Solo tras guardar: las fotos quitadas se borran de R2.
    const kept = new Set(imgs.images.map((i) => i.key));
    await deleteMedia(previous.filter((i) => !kept.has(i.key)).map((i) => i.key));

    revalidatePath("/dashboard/productos");
    revalidatePublicCatalogs(await publicCatalogSlugs(supabase, id));
    return ok("Producto actualizado.");
  }

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
  if (error) {
    console.error("[updateProduct]", error.code, error.message);
    return fail("No se pudo actualizar.");
  }

  // Solo tras guardar: las fotos quitadas se borran de R2.
  const kept = new Set(imgs.images.map((i) => i.key));
  await deleteMedia(previous.filter((i) => !kept.has(i.key)).map((i) => i.key));

  revalidatePath("/dashboard/productos");
  // Nombre, precio y fotos se renderizan en cada catálogo público que lo
  // incluya; sin esto el comprador sigue viendo los datos viejos.
  revalidatePublicCatalogs(await publicCatalogSlugs(supabase, id));
  return ok("Producto actualizado.");
}

/**
 * Borra el producto y sus imágenes de R2.
 *
 * Devuelve estado: antes era `void` y se tragaba el error del delete, así que
 * un borrado rechazado por RLS se veía como éxito en la interfaz.
 */
export async function deleteProduct(id: string): Promise<ActionState> {
  const business = await getBusiness();
  if (!business) return fail("No autorizado.");
  if (!id) return fail("Producto inválido.");

  const supabase = await createClient();
  // Antes de borrar: las filas de catalog_product se van en cascada, después
  // ya no se podría saber en qué catálogos aparecía.
  const slugs = await publicCatalogSlugs(supabase, id);

  let keys: string[];
  if (backendEnabled()) {
    // El backend borra y devuelve las imágenes para que el front limpie R2.
    const res = await backendFetch<{ images: StoredImage[] }>(
      `/api/products/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!res.ok) return fail(res.status === 404 ? "El producto ya no existe." : res.message);
    keys = (res.data?.images ?? []).map((i) => i.key);
  } else {
    const { data: removed, error } = await supabase
      .from("product")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id)
      .select("images");
    if (error) {
      console.error("[deleteProduct]", error.code, error.message);
      return fail("No se pudo eliminar el producto.");
    }
    // Sin filas: no existe o no es del negocio (RLS). Antes pasaba por éxito.
    if (!removed || removed.length === 0) return fail("El producto ya no existe.");
    keys = (removed as { images: StoredImage[] | null }[]).flatMap((r) =>
      (r.images ?? []).map((i) => i.key),
    );
  }
  await deleteMedia(keys);

  revalidatePath("/dashboard/productos");
  // Contador de productos y checklist de la portada.
  revalidatePath("/dashboard");
  // La lista de catálogos muestra cuántos productos tiene cada uno, y ese
  // número baja al desaparecer las filas de catalog_product en cascada.
  revalidatePath("/dashboard/catalogos");
  revalidatePublicCatalogs(slugs);
  return ok("Producto eliminado.");
}

/* ── Importación masiva ─────────────────────────────────────────────────────
 *
 * Son dos pasos y dos acciones, a propósito:
 *
 *   1. `analyzeImportFile`: lee el archivo (CSV o hoja de cálculo), propone un
 *      mapeo de columnas (Gemini, o la heurística de nombres si la IA no está
 *      disponible) y devuelve una muestra. NO escribe nada.
 *   2. `importProducts`: recibe el archivo otra vez junto con el mapeo que el
 *      usuario confirmó o corrigió, y recién ahí inserta.
 *
 * El archivo se vuelve a enviar en el paso 2 en vez de guardarse entre pasos:
 * no hace falta estado de servidor ni almacenamiento temporal, y el Worker no
 * conserva listas de precios de nadie.
 */

export interface AnalyzeState {
  ok: boolean;
  error?: string;
  analysis?: Analysis;
}

/** Paso 1: analiza el archivo y propone el mapeo. No guarda nada. */
export async function analyzeImportFile(formData: FormData): Promise<AnalyzeState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona un archivo." };
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, error: "El archivo excede 2 MB." };
  }

  const result = await analyzeFile(file);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, analysis: result.analysis };
}

/**
 * Paso 2: importa con el mapeo confirmado.
 *
 * Recalcula el límite del plan y valida cada fila con `productSchema`, igual
 * que la versión que sólo leía CSV. Los mensajes por fila siguen siendo
 * «fila 3: Nombre requerido», con el número de fila del archivo.
 */
export async function importProducts(formData: FormData): Promise<ActionState> {
  const business = await getBusiness();
  if (!business) return fail("No autorizado.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Selecciona un archivo.");
  if (file.size > MAX_IMPORT_BYTES) return fail("El archivo excede 2 MB.");

  // El mapeo llega del navegador: es entrada de usuario y se valida como tal.
  let planJson: unknown;
  try {
    planJson = JSON.parse(String(formData.get("plan") ?? ""));
  } catch {
    return fail("El mapeo de columnas no se pudo leer. Vuelve a elegir el archivo.");
  }
  const planParsed = mappingPlanSchema.safeParse(planJson);
  if (!planParsed.success) {
    return fail("El mapeo de columnas no es válido. Vuelve a elegir el archivo.");
  }
  const plan = planParsed.data;
  if (!plan.columns.some((c) => c.field === "name")) {
    return fail("Indica qué columna tiene el nombre del producto.");
  }

  const read = await readTable(file);
  if (!read.ok) return fail(read.error);

  const supabase = await createClient();
  const { count } = await supabase
    .from("product")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  const limit = getPlan(business.plan).limits.maxProducts;
  const available = Number.isFinite(limit) ? limit - (count ?? 0) : Number.POSITIVE_INFINITY;
  if (available <= 0) return fail("Ya alcanzaste el límite de productos de tu plan.");

  const results = parseRows(read.table.rows, plan, available);
  const toInsert = results
    .filter((r) => r.product)
    .map((r) => {
      const p = r.product as ParsedProduct;
      return {
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
      };
    });
  const skipped = results.filter((r) => r.error).length;
  const problems = problemsText(results);

  if (toInsert.length === 0) {
    return fail(
      skipped > 0
        ? `No se importó ninguna fila. ${problems}.`
        : "No se encontraron filas con datos en el archivo.",
    );
  }

  const { error } = await supabase.from("product").insert(toInsert);
  if (error) {
    console.error("[importProducts]", error.code, error.message);
    return fail("No se pudieron importar los productos.");
  }

  revalidatePath("/dashboard/productos");
  // Contador de productos y checklist de la portada.
  revalidatePath("/dashboard");
  return ok(
    skipped > 0
      ? `Importados ${toInsert.length} productos. Se omitieron ${skipped}: ${problems}.`
      : `Importados ${toInsert.length} productos.`,
  );
}
