import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ExternalLink, Settings2, Lock } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { getSiteUrl } from "@/lib/site";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Catálogos</h1>
          <p className="text-muted-foreground">
            Crea catálogos públicos, elige su apariencia y compártelos por WhatsApp.
          </p>
        </div>
        <UsageMeter
          label="Catálogos"
          used={catalogs.length}
          limit={limit}
          upgradeHref="/dashboard/facturacion"
        />
      </div>

      {canCreate ? (
        <Card>
          <CardContent className="p-5">
            <CatalogCreateForm />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Alcanzaste el límite de catálogos de tu plan.{" "}
            <Link
              href="/dashboard/facturacion"
              className="font-semibold text-primary hover:underline"
            >
              Mejora tu plan
            </Link>{" "}
            para crear más.
          </CardContent>
        </Card>
      )}

      {catalogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <BookOpen className="size-10 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-semibold">Todavía no tienes catálogos</p>
              <p className="text-sm text-muted-foreground">
                Un catálogo es la página que compartes con tus clientes. Crea el primero arriba.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {catalogs.map((c) => {
            const count = productCounts.get(c.id) ?? 0;
            const url = `${base}/c/${c.slug}`;
            return (
              <li key={c.id}>
                <Card className="h-full transition-shadow hover:shadow-soft">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate font-heading font-bold">{c.name}</h2>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          /c/{c.slug}
                        </p>
                      </div>
                      <Badge tone={c.is_public ? "success" : "muted"} className="shrink-0 gap-1">
                        {c.is_public ? "Público" : <><Lock className="size-3" aria-hidden="true" /> Borrador</>}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {count === 0 ? (
                        <span className="font-medium text-accent">
                          Sin productos — agrégalos antes de compartir
                        </span>
                      ) : (
                        `${count} ${count === 1 ? "producto" : "productos"}`
                      )}
                    </p>

                    <div className="mt-auto flex items-center gap-2">
                      <Link
                        href={`/dashboard/catalogos/${c.id}`}
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        <Settings2 className="size-4" aria-hidden="true" /> Gestionar
                      </Link>
                      {c.is_public ? (
                        <>
                          <Link
                            href={`/c/${c.slug}`}
                            target="_blank"
                            aria-label={`Abrir ${c.name} en una pestaña nueva`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-3 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
                          >
                            <ExternalLink className="size-4" aria-hidden="true" /> Ver
                          </Link>
                          <CatalogQuickActions url={url} name={c.display_name || c.name} />
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Publícalo para compartirlo
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
