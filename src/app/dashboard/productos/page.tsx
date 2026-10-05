import Link from "next/link";
import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { ProductsClient } from "./products-client";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import type { Product } from "@/types/database";

export const metadata: Metadata = { title: "Productos", robots: { index: false } };

export default async function ProductosPage() {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data } = await supabase
    .from("product")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  const products = (data as Product[] | null) ?? [];
  const limit = getPlan(business.plan).limits.maxProducts;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Productos</h1>
          <p className="text-muted-foreground">
            Precios y stock que verán tus clientes en los catálogos.
          </p>
        </div>
        {/* Consumo del plan visible: evita la sorpresa de chocar con el límite
            justo al guardar. */}
        <UsageMeter
          label="Productos"
          used={products.length}
          limit={limit}
          upgradeHref="/dashboard/facturacion"
        />
      </div>

      <ProductsClient products={products} limit={limit} />

      <p className="text-center text-xs text-muted-foreground">
        ¿Muchos productos? Impórtalos en bloque con un CSV o revisa{" "}
        <Link href="/dashboard/catalogos" className="font-medium text-primary hover:underline">
          qué productos incluye cada catálogo
        </Link>
        .
      </p>
    </div>
  );
}
