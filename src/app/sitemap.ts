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

  return entries;
}
