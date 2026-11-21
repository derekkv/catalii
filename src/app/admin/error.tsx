"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Límite de error del panel de administración.
 *
 * Cubre lo que no es «no hay datos» sino «no se pudo preguntar»: Supabase
 * inalcanzable, Auth caído o una consulta rechazada. Sin esto, el panel
 * mostraría la pantalla genérica de Next, en inglés y sin salida.
 *
 * El mensaje del error NO se imprime: puede incluir detalles internos de la
 * base. Queda en los logs del servidor y en pantalla solo la referencia.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="t-h2">No se pudieron cargar los datos</h1>
            <p className="t-body mt-2 text-muted-foreground">
              El panel no pudo consultar la base de datos. Suele ser una interrupción momentánea;
              vuelve a intentarlo. Si insiste, revisa los logs del servidor.
            </p>
          </div>

          {error.digest && (
            <p className="t-label text-muted-foreground">Referencia {error.digest}</p>
          )}

          <Button onClick={reset} className="gap-2">
            <RotateCw className="size-4" aria-hidden="true" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
