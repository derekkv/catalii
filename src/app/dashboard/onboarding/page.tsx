import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getBusiness } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";
import { Wordmark } from "@/components/brand/wordmark";

export const metadata: Metadata = {
  title: "Configura tu negocio",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const business = await getBusiness();
  if (business) redirect("/dashboard");

  return (
    <main id="contenido" className="grain mx-auto max-w-lg px-5 py-14">
      <Wordmark size="sm" className="text-muted-foreground" />

      <p className="t-eyebrow mt-9">Paso 1 de 1</p>
      <h1 className="t-h1 mt-4">Cuéntanos de tu negocio</h1>
      <p className="t-body mt-3 text-muted-foreground">
        Con esto creamos tu espacio. Todo se puede cambiar después.
      </p>

      <div className="mt-9 rule-t pt-8">
        <OnboardingForm defaultEmail={user.email ?? undefined} />
      </div>
    </main>
  );
}
