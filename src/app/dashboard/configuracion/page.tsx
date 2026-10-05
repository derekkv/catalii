import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
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
    </div>
  );
}
