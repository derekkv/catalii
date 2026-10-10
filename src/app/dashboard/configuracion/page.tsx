import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
import { BusinessBrandImages } from "./brand-images";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Ajustes", robots: { index: false } };

export default async function ConfiguracionPage() {
  const business = await requireBusiness();

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <PageHeader
        eyebrow="Cuenta"
        title="Ajustes"
        description="Los datos de tu negocio y la apariencia por defecto de tus catálogos."
      />
      <SettingsForm business={business} />

      <section className="space-y-4 rule-t pt-6">
        <div>
          <h2 className="t-h2">Imagen de marca</h2>
          <p className="t-small mt-1 text-muted-foreground">
            Se guarda al subirla. Cada catálogo puede reemplazarla con la suya.
          </p>
        </div>
        <BusinessBrandImages business={business} />
      </section>
    </div>
  );
}
