import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CatalogConfigForm, DeleteCatalogButton } from "./catalog-editor";
import { ProductSelector } from "./product-selector";
import { ShareCard } from "./share-card";
import type { Catalog, Product } from "@/types/database";

export const metadata: Metadata = { title: "Gestionar catálogo", robots: { index: false } };

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data: catalog } = await supabase
    .from("catalog")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!catalog) notFound();
  const cat = catalog as Catalog;

  const [{ data: productsData }, { data: linkData }] = await Promise.all([
    supabase.from("product").select("*").eq("business_id", business.id).order("name"),
    supabase.from("catalog_product").select("product_id").eq("catalog_id", id),
  ]);

  const products = (productsData as Product[] | null) ?? [];
  const selectedIds = (linkData ?? []).map((r) => r.product_id as string);
  const base = getSiteUrl();
  const publicUrl = `${base}/c/${cat.slug}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/catalogos"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Volver a catálogos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold md:text-3xl">{cat.name}</h1>
          <p className="text-muted-foreground">
            {selectedIds.length === 0
              ? "Asigna productos y publícalo para compartirlo."
              : `${selectedIds.length} ${selectedIds.length === 1 ? "producto asignado" : "productos asignados"}.`}
          </p>
        </div>
        <Badge tone={cat.is_public ? "success" : "muted"}>
          {cat.is_public ? "Publicado" : "Borrador"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compartir</CardTitle>
          <CardDescription>
            Enlace y QR para mandar por WhatsApp, imprimir o pegar en tu mostrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShareCard url={publicUrl} isPublic={cat.is_public} name={cat.display_name || cat.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración y apariencia</CardTitle>
        </CardHeader>
        <CardContent>
          <CatalogConfigForm
            catalog={cat}
            siteUrl={base}
            productCount={selectedIds.length}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos en el catálogo</CardTitle>
          <CardDescription>
            Elige qué parte de tu inventario se muestra en este catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductSelector catalogId={cat.id} products={products} selectedIds={selectedIds} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <DeleteCatalogButton id={cat.id} name={cat.name} />
      </div>
    </div>
  );
}
