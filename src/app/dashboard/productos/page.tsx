import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { ProductsClient } from "./products-client";
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
  const limitLabel = Number.isFinite(limit) ? `${products.length} / ${limit}` : `${products.length}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Productos</h1>
        <p className="text-muted-foreground">
          {limitLabel} productos · Precios y stock que verán tus clientes.
        </p>
      </div>
      <ProductsClient products={products} />
    </div>
  );
}
