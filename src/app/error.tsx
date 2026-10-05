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
      <span
        className="flex size-12 items-center justify-center rounded-full bg-muted text-destructive"
        aria-hidden="true"
      >
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="font-heading text-2xl font-bold">No pudimos cargar esta página</h1>
      <p className="max-w-sm text-muted-foreground">
        Puede ser un problema temporal de conexión. Intenta de nuevo en unos segundos.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <RotateCw className="size-4" aria-hidden="true" /> Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-[var(--radius-theme-sm)] border border-border bg-card px-5 text-sm font-semibold text-card-foreground transition-colors hover:bg-muted"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
