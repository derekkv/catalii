import { cache } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  Clock,
  Facebook,
  Globe,
  Instagram,
  LayoutGrid,
  MapPin,
  MessageCircle,
  PackageOpen,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/themes";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { absoluteUrl, resolveBrandImage } from "@/lib/media/config";
import { whatsappHref } from "@/lib/whatsapp";
import { LegalLinks } from "@/components/legal/legal-links";
import { LEGAL_PATHS } from "@/lib/legal/config";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Monogram } from "@/components/brand/wordmark";
import { TrackPageView } from "@/components/metrics/track-page-view";
import { WhatsappLink } from "@/components/metrics/whatsapp-link";
import { ShareButton } from "@/app/c/[slug]/catalog-actions";
import { BusinessProducts, type ShowcaseProduct } from "./business-products";
import { PUBLIC_BUSINESS_COLUMNS, type PublicBusiness, type StoredImage } from "@/types/database";

export const revalidate = 60; // ISR, igual que el catálogo público

/**
 * Página pública del negocio.
 *
 * Hasta ahora el negocio solo existía en la base de datos: cada catálogo
 * parecía una tienda independiente. Esta página es la cara del negocio: quién
 * es, cómo se le contacta, qué catálogos tiene y (si lo autoriza) todo lo que
 * vende. El pedido NO vive aquí, vive en el catálogo.
 */

/** Tope de filas catálogo-producto que se traen para el escaparate. */
const SHOWCASE_ROW_LIMIT = 600;

interface PublicCatalogCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_name: string | null;
  logo_url: string | null;
  banner_url: string | null;
  logo_key: string | null;
  banner_key: string | null;
  whatsapp: string | null;
}

interface ShowcaseRow {
  catalog_id: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    price_cents: number;
    currency: string;
    image_url: string | null;
    images: StoredImage[];
    active: boolean;
  } | null;
}

/**
 * Carga el negocio público, sus catálogos y (si procede) su escaparate.
 *
 * `cache()` para que `generateMetadata` y el render compartan el resultado en
 * la misma petición en vez de consultar Supabase dos veces.
 */
const loadBusiness = cache(async (slug: string) => {
  const supabase = await createClient();

  // Solo las columnas con `grant select` a anon (migración 0009). Pedir
  // `email`, `plan` u `owner_id` aquí fallaría por permisos, no por RLS.
  const { data: businessRow } = await supabase
    .from("business")
    .select(PUBLIC_BUSINESS_COLUMNS)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (!businessRow) return null;
  const business = businessRow as unknown as PublicBusiness;

  const { data: catalogRows } = await supabase
    .from("catalog")
    .select(
      "id, name, slug, description, display_name, logo_url, banner_url, logo_key, banner_key, whatsapp",
    )
    .eq("business_id", business.id)
    .eq("is_public", true)
    // El catálogo más antiguo primero: suele ser el principal y el orden no
    // baila cada vez que el mayorista crea uno nuevo.
    .order("created_at", { ascending: true });

  const catalogs = (catalogRows as PublicCatalogCard[] | null) ?? [];

  // ── Escaparate ───────────────────────────────────────────────────────────
  // Los productos visibles son, por definición de las RLS, los activos que
  // están en algún catálogo público: se piden a través de `catalog_product`,
  // que además dice en qué catálogo se pueden pedir.
  let products: ShowcaseProduct[] = [];
  if (business.show_products && catalogs.length > 0) {
    const { data: rows } = await supabase
      .from("catalog_product")
      .select(
        "catalog_id, product:product(id,name,description,category,price_cents,currency,image_url,images,active)",
      )
      .in(
        "catalog_id",
        catalogs.map((c) => c.id),
      )
      .order("catalog_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .limit(SHOWCASE_ROW_LIMIT);

    const byId = new Map<string, PublicCatalogCard>(catalogs.map((c) => [c.id, c]));
    const seen = new Set<string>();
    for (const row of (rows as unknown as ShowcaseRow[] | null) ?? []) {
      const p = row.product;
      const catalog = byId.get(row.catalog_id);
      // Un producto puede estar en varios catálogos: se queda con el primero,
      // para no repetir la misma foto cuatro veces en la rejilla.
      if (!p || !p.active || !catalog || seen.has(p.id)) continue;
      seen.add(p.id);
      products.push({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price_cents: p.price_cents,
        currency: p.currency,
        image_url: p.image_url,
        images: p.images ?? [],
        catalogSlug: catalog.slug,
        catalogName: catalog.display_name || catalog.name,
      });
    }
    products = products.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  const branding = {
    logo: resolveBrandImage(business.logo_key, business.logo_url, "thumb"),
    logoFull: resolveBrandImage(business.logo_key, business.logo_url),
    banner: resolveBrandImage(business.banner_key, null),
  };

  // WhatsApp del negocio. Si el dueño no puso número en su perfil, se usa el
  // del primer catálogo público que lo tenga: es el mismo número que ya ve
  // cualquier comprador y evita dejar la página sin forma de contacto.
  const whatsapp =
    business.whatsapp ?? catalogs.find((c) => whatsappHref(c.whatsapp))?.whatsapp ?? null;

  return { business, catalogs, products, branding, whatsapp };
});

/* ── Enlaces externos ─────────────────────────────────────────────────────── */

/** URL del sitio web tal cual lo escribió el dueño (puede venir sin esquema). */
function websiteUrl(value: string | null): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  // Cualquier otro esquema (javascript:, data:…) se descarta: el campo es
  // texto libre y nadie debe poder meter un enlace ejecutable.
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null;
  return `https://${v}`;
}

function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

/** Usuario de red social, validado con el mismo patrón que la migración. */
function socialUser(value: string | null, pattern: RegExp): string | null {
  const v = (value ?? "").trim().replace(/^@/, "");
  return v && pattern.test(v) ? v : null;
}

const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
const FACEBOOK_RE = /^[A-Za-z0-9._-]{1,60}$/;

/* ── Metadatos ────────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadBusiness(slug);
  if (!data) return { title: "Negocio no encontrado", robots: { index: false } };

  const { business, branding, catalogs } = data;
  const description =
    business.tagline ||
    business.description?.slice(0, 200) ||
    `${business.name}: catálogos, productos y contacto. ${catalogs.length === 1 ? "1 catálogo" : `${catalogs.length} catálogos`} en línea.`;
  const url = `${getSiteUrl()}/n/${business.slug}`;
  const ogImage = branding.banner ?? branding.logoFull;

  return {
    title: business.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: business.name,
      description,
      url,
      images: ogImage ? [{ url: absoluteUrl(ogImage, getSiteUrl()) }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

/* ── Página ───────────────────────────────────────────────────────────────── */

export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadBusiness(slug);
  if (!data) notFound();

  const { business, catalogs, products, branding, whatsapp } = data;
  const theme = resolveTheme(business.theme);
  const site = getSiteUrl();
  const url = `${site}/n/${business.slug}`;

  const waHref = whatsappHref(whatsapp);
  const website = websiteUrl(business.website);
  const instagram = socialUser(business.instagram, INSTAGRAM_RE);
  const facebook = socialUser(business.facebook, FACEBOOK_RE);
  const place = [business.city, business.country].filter(Boolean).join(", ");
  const hasContact = Boolean(
    waHref ||
      business.phone ||
      business.address ||
      place ||
      business.hours ||
      website ||
      instagram ||
      facebook,
  );

  // JSON-LD: LocalBusiness si hay algo físico (dirección o teléfono) y
  // Organization si no. Solo se declara lo que el dueño rellenó.
  const isLocal = Boolean(business.address || place || business.phone);
  const sameAs = [
    website,
    instagram ? `https://instagram.com/${instagram}` : null,
    facebook ? `https://facebook.com/${facebook}` : null,
  ].filter((v): v is string => Boolean(v));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isLocal ? "LocalBusiness" : "Organization",
    name: business.name,
    url,
    ...(business.description || business.tagline
      ? { description: business.description || business.tagline }
      : {}),
    ...(branding.logoFull ? { logo: absoluteUrl(branding.logoFull, site) } : {}),
    ...(branding.banner ? { image: absoluteUrl(branding.banner, site) } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.address || business.city || business.country
      ? {
          address: {
            "@type": "PostalAddress",
            ...(business.address ? { streetAddress: business.address } : {}),
            ...(business.city ? { addressLocality: business.city } : {}),
            ...(business.country ? { addressCountry: business.country } : {}),
          },
        }
      : {}),
    ...(business.hours ? { openingHours: business.hours } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  // Nonce de la CSP (lo pone src/middleware.ts en la cabecera x-nonce). Sin
  // él, con la política en modo bloqueo el navegador descarta el JSON-LD.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <div data-theme={theme} className="grain min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackPageView kind="business_view" businessSlug={business.slug} />

      {/* ══ Cabecera ════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/94 backdrop-blur-sm">
        <div className="mx-auto flex h-[68px] max-w-3xl items-center gap-3 px-4">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo}
              alt=""
              className="size-10 shrink-0 rounded-[var(--radius-theme-sm)] object-cover"
            />
          ) : (
            <Monogram letter={business.name} className="size-10 shrink-0 text-lg" />
          )}

          <div className="min-w-0 flex-1">
            {/* El título de la página es el <h1> del cuerpo; aquí es solo el
                rótulo que acompaña al logo mientras se hace scroll. */}
            <p className="t-h3 truncate">{business.name}</p>
            <p className="t-label mt-1 truncate text-muted-foreground">
              {business.category || "Negocio"}
            </p>
          </div>

          {waHref && (
            <WhatsappLink
              href={waHref}
              businessSlug={business.slug}
              label={`Escribir a ${business.name} por WhatsApp`}
              title="Escribir por WhatsApp"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
            </WhatsappLink>
          )}
          <ShareButton
            url={url}
            title={business.name}
            label="Compartir negocio"
            shareText={`Mira los catálogos de ${business.name}`}
          />
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

        {/* ── Presentación ──────────────────────────────────────────────── */}
        <section className="pt-8" aria-labelledby="negocio-nombre">
          {business.category && (
            <p className="t-eyebrow text-muted-foreground">{business.category}</p>
          )}
          <h1 id="negocio-nombre" className="t-h1 mt-2">
            {business.name}
          </h1>
          {business.tagline && <p className="t-lead mt-3 text-muted-foreground">{business.tagline}</p>}
          {business.description && (
            <p className="t-body mt-4 max-w-prose whitespace-pre-line text-muted-foreground">
              {business.description}
            </p>
          )}

          {waHref && (
            <WhatsappLink
              href={waHref}
              businessSlug={business.slug}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> Escribir por WhatsApp
            </WhatsappLink>
          )}
        </section>

        {/* ── Contacto ──────────────────────────────────────────────────── */}
        {hasContact && (
          <section className="mt-10" aria-labelledby="negocio-contacto">
            <h2 id="negocio-contacto" className="t-h3">
              Contacto
            </h2>
            <dl className="mt-4 grid gap-4 rule-t pt-5 sm:grid-cols-2">
              {business.phone && (
                <ContactItem icon={Phone} label="Teléfono">
                  <a href={`tel:${business.phone.replace(/[^0-9+]/g, "")}`} className="link-ink">
                    {business.phone}
                  </a>
                </ContactItem>
              )}
              {(business.address || place) && (
                <ContactItem icon={MapPin} label="Dirección">
                  {business.address && <span className="block">{business.address}</span>}
                  {place && <span className="block text-muted-foreground">{place}</span>}
                </ContactItem>
              )}
              {business.hours && (
                <ContactItem icon={Clock} label="Horario">
                  <span className="whitespace-pre-line">{business.hours}</span>
                </ContactItem>
              )}
              {website && (
                <ContactItem icon={Globe} label="Sitio web">
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-ink break-words"
                  >
                    {prettyUrl(website)}
                  </a>
                </ContactItem>
              )}
              {instagram && (
                <ContactItem icon={Instagram} label="Instagram">
                  <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-ink"
                  >
                    @{instagram}
                  </a>
                </ContactItem>
              )}
              {facebook && (
                <ContactItem icon={Facebook} label="Facebook">
                  <a
                    href={`https://facebook.com/${facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-ink"
                  >
                    {facebook}
                  </a>
                </ContactItem>
              )}
            </dl>
          </section>
        )}

        {/* ── Catálogos ─────────────────────────────────────────────────── */}
        <section className="mt-12" aria-labelledby="negocio-catalogos">
          <h2 id="negocio-catalogos" className="t-h2">
            {catalogs.length === 1 ? "Su catálogo" : "Sus catálogos"}
          </h2>

          {catalogs.length === 0 ? (
            <div className="mt-5 flex flex-col items-start gap-3 border border-border bg-card p-6">
              <LayoutGrid className="size-7 text-muted-foreground" aria-hidden="true" />
              <p className="t-body text-muted-foreground">
                {business.name} todavía no tiene catálogos publicados. Si esperabas una lista de
                precios, escríbele y te la comparte en cuanto esté lista.
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {catalogs.map((c) => (
                <CatalogCard key={c.id} catalog={c} />
              ))}
            </ul>
          )}
        </section>

        {/* ── Escaparate de productos ───────────────────────────────────── */}
        {business.show_products && products.length > 0 && (
          <section className="mt-12" aria-labelledby="negocio-productos">
            <h2 id="negocio-productos" className="t-h2">
              Todo lo que vende
            </h2>
            <p className="t-small mt-2 text-muted-foreground">
              Vista general de los productos publicados. Para pedir, abre el catálogo donde está
              cada uno.
            </p>
            <div className="mt-5">
              <BusinessProducts products={products} />
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-7 text-center">
        <a
          href={site}
          className="t-label link-ink inline-flex items-center gap-2 text-muted-foreground"
        >
          <BrandLogo symbolOnly size="sm" decorative />
          Página hecha con {siteConfig.name}
        </a>
        <LegalLinks
          className="mt-3 flex justify-center"
          only={[LEGAL_PATHS.privacy, LEGAL_PATHS.terms]}
        />
      </footer>
    </div>
  );
}

/* ── Piezas ───────────────────────────────────────────────────────────────── */

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="t-label text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

function CatalogCard({ catalog }: { catalog: PublicCatalogCard }) {
  const name = catalog.display_name || catalog.name;
  const logo = resolveBrandImage(catalog.logo_key, catalog.logo_url, "thumb");
  const banner = resolveBrandImage(catalog.banner_key, catalog.banner_url);

  return (
    <li>
      <article className="h-full border border-border bg-card transition-colors hover:border-input">
        <Link
          href={`/c/${catalog.slug}`}
          className="group flex h-full flex-col"
        >
          {banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[3/1] w-full border-b border-border object-cover"
            />
          )}
          <div className="flex flex-1 items-start gap-3 p-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                loading="lazy"
                className="size-10 shrink-0 rounded-[var(--radius-theme-sm)] object-cover"
              />
            ) : (
              <PackageOpen className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="t-h3 text-base">{name}</h3>
              {catalog.description && (
                <p className="t-small mt-1.5 line-clamp-2 text-muted-foreground">
                  {catalog.description}
                </p>
              )}
              <p className="t-label mt-3 inline-flex items-center gap-1 text-primary">
                Ver catálogo
                <ArrowUpRight
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </p>
            </div>
          </div>
        </Link>
      </article>
    </li>
  );
}
