import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, getBusiness } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

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
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
      <Card className="w-full animate-fade-up shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">¡Bienvenido! 👋</CardTitle>
          <CardDescription>
            Cuéntanos sobre tu negocio para crear tu primer catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm defaultEmail={user.email ?? undefined} />
        </CardContent>
      </Card>
    </main>
  );
}
