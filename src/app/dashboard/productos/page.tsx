import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { ProductsClient } from "./products-client";
import { PageHeader } from "@/components/dashboard/page-header";
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
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        eyebrow="Inventario"
        title="Productos"
        description="Los precios y el stock que verán tus clientes en los catálogos."
        actions={
          <UsageMeter
            label="Productos"
            used={products.length}
            limit={limit}
            upgradeHref="/dashboard/facturacion"
          />
        }
      />

      <ProductsClient products={products} limit={limit} />
    </div>
  );
}
