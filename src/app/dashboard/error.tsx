"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Límite de error del panel.
 *
 * Sin esto, un fallo de red con Supabase mostraba la pantalla de error genérica
 * de Next (en inglés y sin salida). Aquí el usuario puede reintentar sin perder
 * la sesión ni volver a iniciarla.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Queda en los logs del Worker (observability está activado en wrangler).
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="t-h2">Algo no cargó bien</h1>
            <p className="t-body mt-2 text-muted-foreground">
              Puede ser una interrupción momentánea de conexión. Vuelve a intentarlo.
            </p>
          </div>

          {error.digest && (
            <p className="t-label text-muted-foreground">Referencia {error.digest}</p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset} className="gap-2">
              <RotateCw className="size-4" aria-hidden="true" /> Reintentar
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Ir al resumen</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
