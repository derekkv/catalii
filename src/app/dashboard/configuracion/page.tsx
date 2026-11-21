import type { Metadata } from "next";
import { requireBusiness, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestSiteUrl } from "@/lib/site";
import { DataSection } from "./data-section";
import { SettingsForm } from "./settings-form";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Ajustes", robots: { index: false } };

export default async function ConfiguracionPage() {
  const business = await requireBusiness();
  const user = await getUser();
  const supabase = await createClient();

  // Host real de la petición, igual que en la página del catálogo: así el
  // enlace que se copia funciona aunque el dominio canónico todavía no esté
  // conectado. Los dos recuentos son para avisar en el bloque de publicación:
  // la página sólo lista productos activos que estén en un catálogo público.
  const [base, { count: activeProducts }, { count: publicCatalogs }] = await Promise.all([
    getRequestSiteUrl(),
    supabase
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("active", true),
    supabase
      .from("catalog")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_public", true),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <PageHeader
        eyebrow="Cuenta"
        title="Ajustes"
        description="Los datos de tu negocio, lo que se ve en tu página pública y la apariencia por defecto de tus catálogos."
      />

      <SettingsForm
        business={business}
        siteUrl={base}
        activeProducts={activeProducts ?? 0}
        publicCatalogs={publicCatalogs ?? 0}
      />

      <DataSection email={user?.email ?? ""} />
    </div>
  );
}
