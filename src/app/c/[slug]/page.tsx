import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/themes";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { Storefront, type PublicProduct } from "./storefront";
import { ShareButton } from "./catalog-actions";
import type { Catalog } from "@/types/database";

export const revalidate = 60; // ISR: regenera catálogos públicos cada 60s

interface RawProduct extends PublicProduct {
  active: boolean;
}

interface CatalogProductRow {
  sort_order: number;
  product: RawProduct | null;
}

async function loadCatalog(slug: string) {
  const supabase = await createClient();
  const { data: catalog } = await supabase
    .from("catalog")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (!catalog) return null;
  const cat = catalog as Catalog;

  const { data: rows } = await supabase
    .from("catalog_product")
    .select("sort_order, product:product(id,name,description,category,price_cents,currency,stock,min_order_qty,image_url,active)")
    .eq("catalog_id", cat.id)
    .order("sort_order", { ascending: true });

  const products: PublicProduct[] = ((rows as unknown as CatalogProductRow[]) ?? [])
    .map((r) => r.product)
    .filter((p): p is RawProduct => p !== null && p.active);

  return { catalog: cat, products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCatalog(slug);
  if (!data) return { title: "Catálogo no encontrado", robots: { index: false } };

  const name = data.catalog.display_name || data.catalog.name;
  const description =
    data.catalog.description ||
    `Catálogo de ${name}. Explora productos, precios y haz tu pedido en línea.`;
  const url = `${getSiteUrl()}/c/${data.catalog.slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: name,
      description,
      url,
      images: data.catalog.banner_url ? [{ url: data.catalog.banner_url }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadCatalog(slug);
  if (!data) notFound();

  const { catalog, products } = data;
  const theme = resolveTheme(catalog.theme);
  const displayName = catalog.display_name || catalog.name;
  const url = `${getSiteUrl()}/c/${catalog.slug}`;

  // JSON-LD para SEO (tienda + listado de productos)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: displayName,
    url,
    ...(catalog.description ? { description: catalog.description } : {}),
    makesOffer: products.slice(0, 30).map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Product", name: p.name },
      price: (p.price_cents / 100).toFixed(2),
      priceCurrency: p.currency,
    })),
  };

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-background text-foreground"
      // Altura del header fijo: única fuente de verdad para el offset de la
      // barra de filtros (antes era un `top-[57px]` mágico y desalineado).
      style={{ "--catalog-header-h": "65px" } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-30 h-[var(--catalog-header-h)] border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-3xl items-center gap-3 px-4">
          {catalog.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={catalog.logo_url}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-heading text-lg font-bold text-on-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-lg font-bold">{displayName}</h1>
            {catalog.description && (
              <p className="truncate text-xs text-muted-foreground">{catalog.description}</p>
            )}
          </div>

          {/* Contacto directo: muchos compradores mayoristas prefieren preguntar
              antes de armar el pedido (disponibilidad, crédito, flete). */}
          {catalog.whatsapp && (
            <a
              href={`https://wa.me/${catalog.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Escribir a ${displayName} por WhatsApp`}
              title="Escribir por WhatsApp"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
            </a>
          )}
          <ShareButton url={url} title={displayName} />
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-3xl px-4 pb-24">
        {catalog.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={catalog.banner_url}
            alt=""
            className="mt-4 aspect-[3/1] w-full rounded-[var(--radius-theme)] object-cover"
          />
        )}

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <PackageOpen className="size-12 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-xl font-bold">Catálogo en preparación</h2>
            <p className="max-w-sm text-muted-foreground">
              {displayName} todavía no publicó productos aquí. Vuelve en un rato.
            </p>
            {catalog.whatsapp && (
              <a
                href={`https://wa.me/${catalog.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-semibold text-on-primary hover:opacity-90"
              >
                <MessageCircle className="size-4" aria-hidden="true" /> Escribir por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <Storefront
            slug={catalog.slug}
            displayName={displayName}
            whatsapp={catalog.whatsapp}
            products={products}
          />
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <a href={getSiteUrl()} className="hover:underline">
          Hecho con {siteConfig.name}
        </a>
      </footer>
    </div>
  );
}
