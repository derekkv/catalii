import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ExternalLink, Settings2 } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { getSiteUrl } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { CatalogCreateForm } from "./catalog-create-form";
import { CatalogQuickActions } from "./catalog-card-actions";
import type { Catalog } from "@/types/database";

export const metadata: Metadata = { title: "Catálogos", robots: { index: false } };

export default async function CatalogosPage() {
  const business = await requireBusiness();
  const supabase = await createClient();

  const [catalogsRes, countsRes] = await Promise.all([
    supabase
      .from("catalog")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase.from("catalog_product").select("catalog_id"),
  ]);

  const catalogs = (catalogsRes.data as Catalog[] | null) ?? [];

  // Nº de productos por catálogo: sin este dato es fácil publicar un catálogo
  // vacío y compartirlo sin darse cuenta.
  const productCounts = new Map<string, number>();
  for (const row of countsRes.data ?? []) {
    const key = row.catalog_id as string;
    productCounts.set(key, (productCounts.get(key) ?? 0) + 1);
  }

  const limit = getPlan(business.plan).limits.maxCatalogs;
  const canCreate = catalogs.length < limit;
  const base = getSiteUrl();

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        eyebrow="Difusión"
        title="Catálogos"
        description="Cada catálogo es una página con su propio enlace. Elige qué productos entran y cómo se ve."
        actions={
          <UsageMeter
            label="Catálogos"
            used={catalogs.length}
            limit={limit}
            upgradeHref="/dashboard/facturacion"
          />
        }
      />

      {canCreate ? (
        <CatalogCreateForm />
      ) : (
        <p className="border-l-2 border-accent bg-muted px-4 py-3 text-sm">
          Alcanzaste el límite de catálogos de tu plan.{" "}
          <Link href="/dashboard/facturacion" className="link-ink font-medium text-primary">
            Mejora tu plan
          </Link>{" "}
          para crear más.
        </p>
      )}

      {catalogs.length === 0 ? (
        <div className="rule-t rule-b flex flex-col items-center gap-3 py-14 text-center">
          <BookOpen className="size-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="t-h3">Todavía no tienes catálogos</p>
            <p className="t-small mt-1 max-w-sm text-muted-foreground">
              Un catálogo es la página que compartes con tus clientes. Crea el primero arriba.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid-ruled grid sm:grid-cols-2">
          {catalogs.map((c) => {
            const count = productCounts.get(c.id) ?? 0;
            const url = `${base}/c/${c.slug}`;
            return (
              <li key={c.id} className="flex flex-col gap-4 p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="t-h3 min-w-0 truncate">{c.name}</h2>
                    <Badge tone={c.is_public ? "success" : "muted"} className="shrink-0">
                      {c.is_public ? "Público" : "Borrador"}
                    </Badge>
                  </div>
                  <p className="t-label mt-2 truncate text-muted-foreground">/c/{c.slug}</p>

                  <p className="t-small mt-3">
                    {count === 0 ? (
                      <span className="font-medium text-accent">
                        Sin productos — agrégalos antes de compartir
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        <span className="t-num text-foreground">{count}</span>{" "}
                        {count === 1 ? "producto" : "productos"}
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-1.5">
                  <Link
                    href={`/dashboard/catalogos/${c.id}`}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] border border-input px-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Settings2 className="size-4" aria-hidden="true" /> Gestionar
                  </Link>
                  {c.is_public ? (
                    <>
                      <Link
                        href={`/c/${c.slug}`}
                        target="_blank"
                        aria-label={`Abrir ${c.name} en una pestaña nueva`}
                        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-theme-sm)] bg-primary text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </Link>
                      <CatalogQuickActions url={url} name={c.display_name || c.name} />
                    </>
                  ) : (
                    <span className="t-label px-2 text-muted-foreground">
                      Publícalo para compartir
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
