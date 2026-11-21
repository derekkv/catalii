import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
  ];

  // Incluye catálogos públicos (lectura permitida por RLS a anon).
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("catalog")
      .select("slug, updated_at")
      .eq("is_public", true)
      .limit(5000);

    for (const c of data ?? []) {
      entries.push({
        url: `${base}/c/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // Sin conexión a Supabase (build sin envs): devuelve solo la home.
  }

  // Páginas públicas de negocio. Van en su propio bloque porque dependen de
  // la migración 0009: mientras no esté aplicada, `anon` no puede leer
  // `business`, la consulta devuelve `data: null` y el sitemap se queda con
  // los catálogos en lugar de perderse entero.
  //
  // `updated_at` no está entre las columnas públicas, así que se usa
  // `created_at` como `lastModified`: es peor señal de frescura, pero mejor
  // que no mandar ninguna, y el buscador revisita por `changeFrequency`.
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("business")
      .select("slug, created_at")
      .eq("is_public", true)
      .limit(5000);

    for (const b of data ?? []) {
      entries.push({
        url: `${base}/n/${b.slug}`,
        lastModified: b.created_at ? new Date(b.created_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Migración 0009 sin aplicar o sin conexión: se omiten los negocios.
  }

  return entries;
}
