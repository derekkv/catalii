import Link from "next/link";
import type { Metadata } from "next";
import { ResetForm } from "./reset-form";
import { Wordmark } from "@/components/brand/wordmark";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <main
      id="contenido"
      className="grain flex min-h-screen flex-col items-center justify-center px-5 py-12"
    >
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Catalii, ir al inicio">
          <Wordmark size="lg" className="block" />
        </Link>
        <p className="t-eyebrow mt-3">Restablecer acceso</p>

        <h1 className="t-h1 mt-4">Elige una contraseña nueva</h1>

        <div className="mt-8 rule-t pt-7">
          <ResetForm />
        </div>
      </div>
    </main>
  );
}
