"use client";

import { useActionState, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { deleteAccountAction, type DeleteAccountState } from "./account-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/input";

const initial: DeleteAccountState = { ok: false };

export function DataSection({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccountAction, initial);
  const [typed, setTyped] = useState("");
  const confirmed =
    typed.trim() === "BORRAR" || (!!email && typed.trim().toLowerCase() === email.toLowerCase());

  return (
    <section className="space-y-6 rule-t pt-6" aria-labelledby="tus-datos">
      <div>
        <h2 id="tus-datos" className="t-h2">Tus datos</h2>
        <p className="t-small mt-1 text-muted-foreground">
          Descarga una copia de lo que guardamos de tu cuenta o elimínala.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="t-label text-muted-foreground">Descargar mis datos</h3>
        <FieldHint>
          Un archivo JSON con tu cuenta, negocio, productos, catálogos, pedidos, aceptaciones
          legales y datos de suscripción. Las imágenes se incluyen solo como referencias.
        </FieldHint>
        {/* Descarga normal (GET, mismo origen): el servidor responde con attachment. */}
        <a
          href="/api/account/export"
          download
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] border border-input px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar mis datos
        </a>
      </div>

      <form action={action} className="space-y-3 border-l-2 border-destructive pl-4">
        <h3 className="t-label text-destructive">Borrar mi cuenta</h3>
        <FieldHint>
          Es permanente. Cancelaremos de inmediato tu suscripción de pago, eliminaremos tu
          negocio, productos, catálogos, pedidos e imágenes y cerraremos tu sesión. No se puede
          deshacer. Algunos registros de facturación pueden conservarse en el proveedor de pagos.
        </FieldHint>
        <div>
          <Label htmlFor="del-confirm">
            Para confirmar, escribe tu correo{email ? ` (${email})` : ""} o la palabra BORRAR
          </Label>
          <Input
            id="del-confirm"
            name="confirmation"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
        {state.error && <FieldError>{state.error}</FieldError>}
        <Button type="submit" variant="destructive" disabled={!confirmed || pending} className="gap-2">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Borrar mi cuenta definitivamente
        </Button>
      </form>
    </section>
  );
}
