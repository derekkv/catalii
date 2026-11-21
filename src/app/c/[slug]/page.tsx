import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/themes";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { LegalLinks } from "@/components/legal/legal-links";
import { LEGAL_PATHS } from "@/lib/legal/config";
import { absoluteUrl, productImages, resolveBrandImage } from "@/lib/media/config";
import { whatsappHref } from "@/lib/whatsapp";
import { Storefront, type PublicProduct } from "./storefront";
import { ShareButton } from "./catalog-actions";
import { Monogram } from "@/components/brand/wordmark";
import { BrandLogo } from "@/components/brand/brand-logo";
import { TrackPageView } from "@/components/metrics/track-page-view";
import { WhatsappLink } from "@/components/metrics/whatsapp-link";
import { PUBLIC_BUSINESS_COLUMNS, type Catalog, type PublicBusiness } from "@/types/database";

export const revalidate = 60; // ISR: regenera catálogos públicos cada 60s

interface RawProduct extends PublicProduct {
  active: boolean;
}

interface CatalogProductRow {
  sort_order: number;
  product: RawProduct | null;
}

/**
 * El negocio dueño viene EMBEBIDO en la consulta del catálogo, no en una
 * consulta aparte: así el catálogo sabe de quién es sin pagar otro viaje a
 * Supabase. La política `business_public_select` de la 0009 solo deja ver los
 * negocios publicados, así que si llega `null` es que no hay página pública
 * que enlazar (o el dueño no la publicó).
 */
type CatalogWithBusiness = Catalog & { business?: PublicBusiness | null };

const loadCatalog = cache(async (slug: string) => {
  const supabase = await createClient();

  let row: CatalogWithBusiness | null = null;
  const embedded = await supabase
    .from("catalog")
    .select(`*, business:business(${PUBLIC_BUSINESS_COLUMNS})`)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (embedded.error) {
    // Reserva mientras la migración 0009 no esté aplicada: sin los permisos
    // de columna sobre `business`, PostgREST rechaza la consulta entera y el
    // catálogo público se caería. Se vuelve a pedir sin el negocio.
    const plain = await supabase
      .from("catalog")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    row = (plain.data as CatalogWithBusiness | null) ?? null;
  } else {
    row = (embedded.data as unknown as CatalogWithBusiness | null) ?? null;
  }

  if (!row) return null;
  const { business = null, ...rest } = row;
  const cat = rest as Catalog;

  const { data: rows } = await supabase
    .from("catalog_product")
    .select("sort_order, product:product(id,name,description,category,price_cents,currency,stock,min_order_qty,image_url,images,active)")
    .eq("catalog_id", cat.id)
    .order("sort_order", { ascending: true });

  const products: PublicProduct[] = ((rows as unknown as CatalogProductRow[]) ?? [])
    .map((r) => r.product)
    .filter((p): p is RawProduct => p !== null && p.active);

  // Logo/banner: los del catálogo; si no tiene, los heredados del negocio.
  // Si el negocio es público ya vienen en la consulta de arriba; si no lo es,
  // se piden al RPC `public_catalog_branding` (su `business` no es legible).
  let logo = resolveBrandImage(cat.logo_key, cat.logo_url, "thumb");
  let logoFull = resolveBrandImage(cat.logo_key, cat.logo_url);
  let banner = resolveBrandImage(cat.banner_key, cat.banner_url);
  if (!logo && business?.logo_key) {
    logo = resolveBrandImage(business.logo_key, null, "thumb");
    logoFull = resolveBrandImage(business.logo_key, null);
  }
  if (!banner && business?.banner_key) banner = resolveBrandImage(business.banner_key, null);
  if ((!logo || !banner) && !business) {
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

  return { catalog: cat, business, products, branding: { logo, logoFull, banner } };
});

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

  const { catalog, business, products, branding } = data;
  const theme = resolveTheme(catalog.theme);
  const displayName = catalog.display_name || catalog.name;
  const url = `${getSiteUrl()}/c/${catalog.slug}`;
  const site = getSiteUrl();
  const waHref = whatsappHref(catalog.whatsapp);

  // JSON-LD para SEO (tienda + listado de productos)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: displayName,
    url,
    ...(catalog.description ? { description: catalog.description } : {}),
    ...(branding.logoFull ? { logo: absoluteUrl(branding.logoFull, site) } : {}),
    // El catálogo es de un negocio, y ahora ese negocio tiene página propia.
    ...(business
      ? {
          parentOrganization: {
            "@type": "Organization",
            name: business.name,
            url: `${site}/n/${business.slug}`,
          },
        }
      : {}),
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

  // Nonce de la CSP (lo pone src/middleware.ts en la cabecera x-nonce). Sin
  // él, con la política en modo bloqueo el navegador descarta este bloque
  // JSON-LD y el catálogo pierde los datos estructurados para buscadores.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

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
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackPageView kind="catalog_view" catalogSlug={catalog.slug} />

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
          {waHref && (
            <WhatsappLink
              href={waHref}
              catalogSlug={catalog.slug}
              label={`Escribir a ${displayName} por WhatsApp`}
              title="Escribir por WhatsApp"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
            </WhatsappLink>
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

        {/* ══ El catálogo pertenece a un negocio ═══════════════════════════
            Sin este enlace, cada catálogo parece una tienda suelta: el
            comprador no sabe que el mismo proveedor tiene otras listas, ni
            dónde ver su dirección o su horario. Solo aparece si el dueño
            publicó la página del negocio (si no, `business` llega nulo). */}
        {business && (
          <Link
            href={`/n/${business.slug}`}
            className="mt-4 flex items-center justify-between gap-3 border border-border bg-card px-4 py-3 transition-colors hover:border-input"
          >
            <span className="min-w-0">
              <span className="t-label block text-muted-foreground">Un catálogo de</span>
              <span className="t-h3 mt-0.5 block truncate text-base">{business.name}</span>
            </span>
            <span className="t-label inline-flex shrink-0 items-center gap-1 text-primary">
              Ver todo el negocio
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </span>
          </Link>
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
            {waHref && (
              <WhatsappLink
                href={waHref}
                catalogSlug={catalog.slug}
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
              >
                <MessageCircle className="size-4" aria-hidden="true" /> Escribir por WhatsApp
              </WhatsappLink>
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
        <a
          href={getSiteUrl()}
          className="t-label link-ink inline-flex items-center gap-2 text-muted-foreground"
        >
          {/* El nombre lo da el texto del enlace: el símbolo es decorativo. */}
          <BrandLogo symbolOnly size="sm" decorative />
          Catálogo hecho con {siteConfig.name}
        </a>
        <LegalLinks
          className="mt-3 flex justify-center"
          only={[LEGAL_PATHS.privacy, LEGAL_PATHS.terms]}
        />
      </footer>
    </div>
  );
}
