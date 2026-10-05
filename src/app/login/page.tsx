import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./auth-form";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Acceder",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main
      id="contenido"
      className="grain flex min-h-screen flex-col items-center justify-center px-5 py-12"
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="t-label link-ink mb-8 inline-flex items-center gap-2 text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Volver al inicio
        </Link>

        <Wordmark size="lg" className="block" />
        <p className="t-label mt-2.5 text-muted-foreground">{siteConfig.tagline}</p>

        <div className="mt-9 rule-t pt-8">
          <Suspense fallback={<div className="h-80" aria-hidden="true" />}>
            <AuthForm />
          </Suspense>
        </div>

        <p className="t-small mt-9 rule-t pt-5 text-muted-foreground">
          Tus datos están protegidos. Nunca compartimos tu información ni la de tus clientes.
        </p>
      </div>
    </main>
  );
}
