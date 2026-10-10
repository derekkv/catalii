import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/themes";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { absoluteUrl, productImages, resolveBrandImage } from "@/lib/media/config";
import { Storefront, type PublicProduct } from "./storefront";
import { ShareButton } from "./catalog-actions";
import { Monogram } from "@/components/brand/wordmark";
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
    .select("sort_order, product:product(id,name,description,category,price_cents,currency,stock,min_order_qty,image_url,images,active)")
    .eq("catalog_id", cat.id)
    .order("sort_order", { ascending: true });

  const products: PublicProduct[] = ((rows as unknown as CatalogProductRow[]) ?? [])
    .map((r) => r.product)
    .filter((p): p is RawProduct => p !== null && p.active);

  // Logo/banner: los del catálogo; si no tiene, los heredados del negocio
  // (vía RPC, porque `business` no es legible por anon).
  let logo = resolveBrandImage(cat.logo_key, cat.logo_url, "thumb");
  let logoFull = resolveBrandImage(cat.logo_key, cat.logo_url);
  let banner = resolveBrandImage(cat.banner_key, cat.banner_url);
  if (!logo || !banner) {
    const { data: inherited } = await supabase.rpc("public_catalog_branding", { p_slug: slug });
    const row = (Array.isArray(inherited) ? inherited[0] : inherited) as
      | { logo_key: string | null; banner_key: string | null }
      | undefined;
    if (!logo && row?.logo_key) {
      logo = resolveBrandImage(row.logo_key, null, "thumb");
      logoFull = resolveBrandImage(row.logo_key, null);
    }
    if (!banner && row?.banner_key) banner = resolveBrandImage(row.banner_key, null);
  }

  return { catalog: cat, products, branding: { logo, logoFull, banner } };
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
  const ogImage = data.branding.banner ?? data.branding.logoFull;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: name,
      description,
      url,
      images: ogImage ? [{ url: absoluteUrl(ogImage, getSiteUrl()) }] : undefined,
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

  const { catalog, products, branding } = data;
  const theme = resolveTheme(catalog.theme);
  const displayName = catalog.display_name || catalog.name;
  const url = `${getSiteUrl()}/c/${catalog.slug}`;
  const site = getSiteUrl();

  // JSON-LD para SEO (tienda + listado de productos)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: displayName,
    url,
    ...(catalog.description ? { description: catalog.description } : {}),
    ...(branding.logoFull ? { logo: absoluteUrl(branding.logoFull, site) } : {}),
    makesOffer: products.slice(0, 30).map((p) => {
      const img = productImages(p)[0];
      return {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: p.name,
          ...(img ? { image: absoluteUrl(img.src, site) } : {}),
        },
        price: (p.price_cents / 100).toFixed(2),
        priceCurrency: p.currency,
      };
    }),
  };

  return (
    <div
      data-theme={theme}
      className="grain min-h-screen bg-background text-foreground"
      // Altura del header fijo: única fuente de verdad para el offset de la
      // barra de filtros (antes era un `top-[57px]` mágico y desalineado).
      style={{ "--catalog-header-h": "68px" } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══ Cabecera del catálogo ═══════════════════════════════════════
          Maquetada como la cabecera de una lista de precios impresa: marca a
          la izquierda, rótulo en versalitas, acciones a la derecha.      */}
      <header className="sticky top-0 z-30 h-[var(--catalog-header-h)] border-b border-border bg-background/94 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-3xl items-center gap-3 px-4">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo}
              alt=""
              className="size-10 shrink-0 rounded-[var(--radius-theme-sm)] object-cover"
            />
          ) : (
            <Monogram letter={displayName} className="size-10 shrink-0 text-lg" />
          )}

          <div className="min-w-0 flex-1">
            <h1 className="t-h3 truncate">{displayName}</h1>
            <p className="t-label mt-1 truncate text-muted-foreground">
              {catalog.description || "Lista de precios · Mayoreo"}
            </p>
          </div>

          {/* Contacto directo: muchos compradores mayoristas prefieren
              preguntar antes de armar el pedido (crédito, flete, existencias). */}
          {catalog.whatsapp && (
            <a
              href={`https://wa.me/${catalog.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Escribir a ${displayName} por WhatsApp`}
              title="Escribir por WhatsApp"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
            </a>
          )}
          <ShareButton url={url} title={displayName} />
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-3xl px-4 pb-24">
        {branding.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.banner}
            alt=""
            fetchPriority="high"
            className="mt-4 aspect-[3/1] w-full border border-border object-cover"
          />
        )}

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <PackageOpen className="size-9 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="t-h2">Catálogo en preparación</h2>
              <p className="t-body mt-2 max-w-sm text-muted-foreground">
                {displayName} todavía no publicó productos aquí. Vuelve en un rato.
              </p>
            </div>
            {catalog.whatsapp && (
              <a
                href={`https://wa.me/${catalog.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
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

      <footer className="border-t border-border py-7 text-center">
        <a href={getSiteUrl()} className="t-label link-ink text-muted-foreground">
          Catálogo hecho con {siteConfig.name}
        </a>
      </footer>
    </div>
  );
}
