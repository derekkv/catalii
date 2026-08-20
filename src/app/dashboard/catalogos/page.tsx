import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ExternalLink, Settings2 } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CatalogCreateForm } from "./catalog-create-form";
import type { Catalog } from "@/types/database";

export const metadata: Metadata = { title: "Catálogos", robots: { index: false } };

export default async function CatalogosPage() {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data } = await supabase
    .from("catalog")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const catalogs = (data as Catalog[] | null) ?? [];
  const limit = getPlan(business.plan).limits.maxCatalogs;
  const canCreate = catalogs.length < limit;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Catálogos</h1>
        <p className="text-muted-foreground">
          Crea catálogos públicos, elige su apariencia y compártelos por WhatsApp.
        </p>
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
            <Link href="/dashboard/facturacion" className="font-medium text-primary hover:underline">
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
            <p className="text-muted-foreground">Aún no tienes catálogos. Crea el primero arriba.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {catalogs.map((c) => (
            <li key={c.id}>
              <Card className="h-full transition-shadow hover:shadow-soft">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-heading font-bold">{c.name}</h2>
                      <p className="truncate text-xs text-muted-foreground">/c/{c.slug}</p>
                    </div>
                    <Badge tone={c.is_public ? "success" : "muted"}>
                      {c.is_public ? "Público" : "Borrador"}
                    </Badge>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/dashboard/catalogos/${c.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Settings2 className="size-4" aria-hidden="true" /> Gestionar
                    </Link>
                    {c.is_public && (
                      <Link
                        href={`/c/${c.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:opacity-90"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" /> Ver
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
