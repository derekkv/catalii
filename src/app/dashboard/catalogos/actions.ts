"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { backendEnabled, backendFetch } from "@/lib/backend";
import type { Catalog } from "@/types/database";
import { catalogSchema, brandImageKeySchema } from "@/lib/validation";
import { getPlan } from "@/lib/plans";
import { slugify } from "@/lib/utils";
import { assertUploadedKey, deleteMedia } from "@/lib/media/server";

export interface CatalogState {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * La portada del panel (`/dashboard`) muestra contadores, el `setup-checklist`
 * y la lista de catálogos públicos, así que casi cualquier cambio en un
 * catálogo la deja obsoleta. La lista (`/dashboard/catalogos`) muestra además
 * el nº de productos por catálogo.
 */
function revalidateCatalogDashboard(catalogId?: string): void {
  revalidatePath("/dashboard/catalogos");
  if (catalogId) revalidatePath(`/dashboard/catalogos/${catalogId}`);
  revalidatePath("/dashboard");
}

/**
 * Invalida la página pública del catálogo. Tiene ISR (`revalidate = 60` en
 * `/c/[slug]/page.tsx`): sin esta llamada el comprador sigue viendo lo viejo
 * hasta que caduque.
 */
function revalidatePublicCatalog(...slugs: (string | null | undefined)[]): void {
  for (const slug of new Set(slugs.filter(Boolean) as string[])) {
    revalidatePath(`/c/${slug}`);
  }
}

export async function createCatalog(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  const useBackend = backendEnabled();
  const supabase = await createClient();

  // Gating por plan. Con backend lo aplica él.
  if (!useBackend) {
    const { count } = await supabase
      .from("catalog")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);
    const limit = getPlan(business.plan).limits.maxCatalogs;
    if ((count ?? 0) >= limit) {
      return { ok: false, error: `Tu plan permite ${limit} catálogo(s). Mejora tu plan para más.` };
    }
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

  if (useBackend) {
    const res = await backendFetch<Catalog>("/api/catalogs", {
      method: "POST",
      body: {
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        display_name: c.display_name || c.name,
        whatsapp: c.whatsapp ?? "",
        theme: c.theme ?? "",
        is_public: false,
      },
    });
    if (!res.ok) return { ok: false, error: res.message };
    revalidateCatalogDashboard();
    redirect(`/dashboard/catalogos/${res.data.id}`);
  }

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

  revalidateCatalogDashboard();
  redirect(`/dashboard/catalogos/${created!.id}`);
}

export async function updateCatalog(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Catálogo inválido." };

  const name = String(formData.get("name") ?? "");
  // logo/banner ya no se editan aquí: se suben a R2 con setCatalogImage().
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
  // Slug anterior: si cambia hay que invalidar también la página pública vieja,
  // porque su copia ISR seguiría sirviéndose hasta caducar.
  const { data: before } = await supabase
    .from("catalog")
    .select("slug")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  const previousSlug = (before as { slug: string } | null)?.slug ?? null;

  if (backendEnabled()) {
    const res = await backendFetch<Catalog>(`/api/catalogs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: {
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        display_name: c.display_name || c.name,
        whatsapp: c.whatsapp ?? "",
        theme: c.theme ?? "",
        is_public: c.is_public,
      },
    });
    if (!res.ok) return { ok: false, error: res.message };
    revalidateCatalogDashboard(id);
    revalidatePublicCatalog(c.slug, previousSlug);
    return { ok: true, message: "Catálogo actualizado." };
  }

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
    console.error("[updateCatalog]", error.code, error.message);
    return { ok: false, error: "No se pudo actualizar el catálogo." };
  }

  revalidateCatalogDashboard(id);
  revalidatePublicCatalog(c.slug, previousSlug);
  return { ok: true, message: "Catálogo actualizado." };
}

/**
 * Elimina el catálogo y sus imágenes de R2.
 *
 * Devuelve estado en vez de redirigir: `redirect()` lanza una excepción por
 * diseño, así que si redirigiera aquí el llamador no podría distinguir «ya se
 * fue a la lista» de «falló». La navegación la hace el componente cliente.
 */
export async function deleteCatalog(id: string): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Catálogo inválido." };

  const supabase = await createClient();
  let row: { slug: string | null; logo_key: string | null; banner_key: string | null };

  if (backendEnabled()) {
    // El backend no devuelve el slug y hace falta para invalidar /c/<slug>.
    const { data: beforeRow } = await supabase
      .from("catalog")
      .select("slug")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle();
    // Devuelve las claves de imagen para que el front limpie R2.
    const res = await backendFetch<{ logo_key: string | null; banner_key: string | null }>(
      `/api/catalogs/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 404 ? "El catálogo ya no existe." : res.message,
      };
    }
    row = {
      slug: (beforeRow as { slug: string } | null)?.slug ?? null,
      logo_key: res.data?.logo_key ?? null,
      banner_key: res.data?.banner_key ?? null,
    };
  } else {
    const { data: removed, error } = await supabase
      .from("catalog")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id)
      .select("slug, logo_key, banner_key");
    if (error) {
      console.error("[deleteCatalog]", error.code, error.message);
      return { ok: false, error: "No se pudo eliminar el catálogo." };
    }
    // Sin filas: o no existe o no es del negocio (RLS). Antes esto pasaba
    // desapercibido y el usuario veía un éxito falso.
    if (!removed || removed.length === 0) {
      return { ok: false, error: "El catálogo ya no existe." };
    }
    row = removed[0] as { slug: string | null; logo_key: string | null; banner_key: string | null };
  }

  // Después del borrado en la BD: `deleteMedia` nunca lanza, un objeto
  // huérfano en R2 es mejor que dejar el catálogo a medio eliminar.
  await deleteMedia([row.logo_key, row.banner_key]);

  revalidateCatalogDashboard(id);
  revalidatePublicCatalog(row.slug);
  return { ok: true, message: "Catálogo eliminado." };
}

/**
 * Asigna (o quita, con `key = null`) el logo o el banner del catálogo.
 * La imagen ya está en R2 (subida por /api/uploads); aquí se valida que sea
 * del negocio, se guarda la clave y se borra la anterior.
 */
export async function setCatalogImage(
  catalogId: string,
  kind: "logo" | "banner",
  key: string | null,
): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  if (kind !== "logo" && kind !== "banner") return { ok: false, error: "Tipo inválido." };

  const parsedKey = brandImageKeySchema.safeParse(key);
  if (!parsedKey.success) return { ok: false, error: "Imagen inválida." };
  if (parsedKey.data && !(await assertUploadedKey(parsedKey.data, business.id, kind).catch(() => false))) {
    return { ok: false, error: "La imagen no se subió correctamente. Reintenta." };
  }

  const column = kind === "logo" ? "logo_key" : "banner_key";
  const legacyColumn = kind === "logo" ? "logo_url" : "banner_url";

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("catalog")
    .select(`slug, ${column}`)
    .eq("id", catalogId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Catálogo no encontrado." };
  const previous = (current as unknown as Record<string, string | null>)[column];

  const { error } = await supabase
    .from("catalog")
    // Al subir o quitar, la URL externa antigua deja de aplicar.
    .update({ [column]: parsedKey.data, [legacyColumn]: null })
    .eq("id", catalogId)
    .eq("business_id", business.id);
  if (error) return { ok: false, error: "No se pudo guardar la imagen." };

  if (previous && previous !== parsedKey.data) await deleteMedia([previous]);

  revalidatePath(`/dashboard/catalogos/${catalogId}`);
  revalidatePath("/dashboard/catalogos");
  revalidatePath(`/c/${(current as { slug: string }).slug}`);
  return { ok: true };
}

/** Productos que se pueden mandar de una vez (tope duplicado en el RPC). */
const syncProductIdsSchema = z.array(z.string().uuid("Selección inválida.")).max(5000);

interface SyncResult {
  slug: string | null;
  count: number;
}

/**
 * Sincroniza qué productos pertenecen al catálogo (set completo).
 *
 * El reemplazo (borrar las filas anteriores + insertar las nuevas) lo hace el
 * RPC `sync_catalog_products` (migración 0008), que al ser una función de
 * PostgreSQL corre en una sola transacción: si el insert falla, el delete se
 * deshace y el catálogo conserva sus productos. Antes se hacían dos llamadas
 * sueltas sin comprobar errores y un fallo a mitad dejaba el catálogo vacío.
 *
 * El RPC también valida la propiedad del catálogo y descarta los productos que
 * no sean del negocio, así que aquí no hace falta repetir esas consultas.
 */
export async function syncCatalogProducts(
  catalogId: string,
  productIds: string[],
): Promise<CatalogState> {
  const business = await getBusiness();
  if (!business) return { ok: false, error: "No autorizado." };
  if (!catalogId) return { ok: false, error: "Catálogo inválido." };

  const parsed = syncProductIdsSchema.safeParse(productIds);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Selección inválida." };
  }
  // El RPC también descarta repetidos, pero así el recuento que se devuelve
  // coincide con lo que el usuario tiene marcado.
  const ids = Array.from(new Set(parsed.data));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sync_catalog_products", {
    p_catalog_id: catalogId,
    p_product_ids: ids,
  });

  if (error) {
    console.error("[syncCatalogProducts]", error.code, error.message);
    // La función todavía no existe en la base de datos.
    if (error.code === "PGRST202") {
      return {
        ok: false,
        error: "Falta aplicar la migración 0008 en la base de datos. No se cambió nada.",
      };
    }
    if (error.message?.includes("Catálogo no encontrado")) {
      return { ok: false, error: "El catálogo ya no existe." };
    }
    if (error.message?.includes("Demasiados productos")) {
      return { ok: false, error: "Son demasiados productos para un solo catálogo." };
    }
    return {
      ok: false,
      error: "No se pudo guardar la selección. No se cambió nada; vuelve a intentarlo.",
    };
  }

  const result = (data ?? null) as SyncResult | null;
  const count = result?.count ?? ids.length;

  revalidateCatalogDashboard(catalogId);
  revalidatePublicCatalog(result?.slug);

  return {
    ok: true,
    message: `Catálogo actualizado con ${count} ${count === 1 ? "producto" : "productos"}.`,
  };
}
