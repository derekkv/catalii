import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetForm } from "./reset-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="mb-6 block text-center font-heading text-3xl font-bold text-brand-gradient">
          {siteConfig.name}
        </Link>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Nueva contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <ResetForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
