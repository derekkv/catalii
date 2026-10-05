"use client";

import * as React from "react";
import { Modal } from "./overlay";
import { Button } from "./button";

/**
 * Confirmación de acciones destructivas.
 *
 * Sustituye a `window.confirm()`, que no se puede estilar, ignora el theme,
 * se bloquea en algunos navegadores móviles y no deja nombrar la acción
 * (siempre "Aceptar/Cancelar"). Aquí el botón dice lo que va a pasar, lo cual
 * reduce borrados accidentales.
 *
 * Uso:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "¿Eliminar?", confirmLabel: "Eliminar" })) { ... }
 */

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "destructive" | "primary";
}

type Resolver = (value: boolean) => void;

const ConfirmContext = React.createContext<(options: ConfirmOptions) => Promise<boolean>>(
  async () => false,
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ options: ConfirmOptions; resolve: Resolver } | null>(
    null,
  );

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setState({ options, resolve })),
    [],
  );

  function settle(value: boolean) {
    state?.resolve(value);
    setState(null);
  }

  const options = state?.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(state)}
        onClose={() => settle(false)}
        title={options?.title ?? ""}
        description={options?.description}
        className="max-w-md"
        hideClose
        footer={
          <>
            <Button variant="ghost" onClick={() => settle(false)}>
              {options?.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              variant={options?.tone === "primary" ? "primary" : "destructive"}
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      >
        {null}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return React.useContext(ConfirmContext);
}
