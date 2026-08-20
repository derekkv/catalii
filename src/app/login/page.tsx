import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Link
          href="/"
          className="mb-6 block text-center font-heading text-2xl font-bold text-brand-gradient"
        >
          {siteConfig.name}
        </Link>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Entra a tu panel</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Nuevo aquí? Con tu correo creamos tu cuenta automáticamente.
        </p>
      </div>
    </main>
  );
}
