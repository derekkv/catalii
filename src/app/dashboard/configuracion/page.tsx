import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ajustes", robots: { index: false } };

export default async function ConfiguracionPage() {
  const business = await requireBusiness();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Ajustes</h1>
        <p className="text-muted-foreground">Datos de tu negocio y apariencia por defecto.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Información del negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm business={business} />
        </CardContent>
      </Card>
    </div>
  );
}
