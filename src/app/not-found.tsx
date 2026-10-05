import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export default function NotFound() {
  return (
    <main
      id="contenido"
      className="grain flex min-h-screen flex-col items-center justify-center px-5 text-center"
    >
      <div className="max-w-md">
        {/* El 404 en mono: es un código, no un titular decorativo. */}
        <p className="t-num text-6xl text-primary">404</p>
        <h1 className="t-h1 mt-5">Esta página no existe</h1>
        <p className="t-body mt-3 text-muted-foreground">
          El catálogo que buscas puede haber cambiado de enlace o dejado de estar publicado.
          Si te lo compartió un proveedor, pídele el enlace actualizado.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
        >
          Ir al inicio
        </Link>

        <div className="mt-12 rule-t pt-5">
          <Wordmark size="sm" className="text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}
