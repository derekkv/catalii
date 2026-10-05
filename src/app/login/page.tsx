import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "./auth-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Acceder",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main id="contenido" className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver al inicio
        </Link>
        <p className="mb-6 text-center font-heading text-3xl font-bold text-brand-gradient">{siteConfig.name}</p>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Tu cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
              <AuthForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Tus datos están protegidos. Nunca compartimos tu información.
        </p>
      </div>
    </main>
  );
}
