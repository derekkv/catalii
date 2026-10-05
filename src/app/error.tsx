"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

/** Límite de error para las rutas públicas (landing y catálogos). */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
      <h1 className="t-h1">No pudimos cargar esta página</h1>
      <p className="t-body max-w-sm text-muted-foreground">
        Puede ser un problema temporal de conexión. Intenta de nuevo en unos segundos.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
        >
          <RotateCw className="size-4" aria-hidden="true" /> Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-[var(--radius-theme-sm)] border border-input px-5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
