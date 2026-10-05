import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
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
    <div className="mx-auto max-w-3xl space-y-5">
      {/* El enlace de vuelta va antes del título: es el orden de lectura y
          evita que el usuario tenga que buscarlo debajo de la cabecera. */}
      <Link
        href="/dashboard/catalogos"
        className="t-label link-ink inline-flex items-center gap-2 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" /> Todos los catálogos
      </Link>

      <PageHeader
        eyebrow="Catálogo"
        title={cat.name}
        description={
          selectedIds.length === 0
            ? "Asigna productos y publícalo para poder compartirlo."
            : `${selectedIds.length} ${selectedIds.length === 1 ? "producto asignado" : "productos asignados"}.`
        }
        actions={
          <Badge tone={cat.is_public ? "success" : "muted"}>
            {cat.is_public ? "Publicado" : "Borrador"}
          </Badge>
        }
      />

      <section className="space-y-4 rule-t pt-6">
        <div>
          <h2 className="t-h2">Compartir</h2>
          <p className="t-small mt-1 text-muted-foreground">
            Enlace y QR para mandar por WhatsApp, imprimir o pegar en el mostrador.
          </p>
        </div>
        <ShareCard url={publicUrl} isPublic={cat.is_public} name={cat.display_name || cat.name} />
      </section>

      <section className="space-y-4 rule-t pt-6">
        <h2 className="t-h2">Configuración y apariencia</h2>
        <CatalogConfigForm catalog={cat} siteUrl={base} productCount={selectedIds.length} />
      </section>

      <section className="space-y-4 rule-t pt-6">
        <div>
          <h2 className="t-h2">Productos en el catálogo</h2>
          <p className="t-small mt-1 text-muted-foreground">
            Elige qué parte de tu inventario se muestra en este catálogo.
          </p>
        </div>
        <ProductSelector catalogId={cat.id} products={products} selectedIds={selectedIds} />
      </section>

      <div className="flex justify-end rule-t pt-6">
        <DeleteCatalogButton id={cat.id} name={cat.name} />
      </div>
    </div>
  );
}
