"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";

/**
 * Confirmación de facturación con dos opciones de igual peso visual (mismo
 * tamaño y variante), para que «mantener» y «confirmar» no se distingan por
 * énfasis. `Modal` ya atrapa el foco, cierra con Esc y devuelve el foco.
 */
export function BillingConfirmDialog({
  open,
  title,
  description,
  details,
  keepLabel,
  confirmLabel,
  busy,
  onKeep,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  details?: React.ReactNode;
  keepLabel: string;
  confirmLabel: string;
  busy: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onKeep();
      }}
      title={title}
      description={description}
      className="max-w-md"
      hideClose
      footer={
        <>
          <Button variant="outline" onClick={onKeep} disabled={busy}>
            {keepLabel}
          </Button>
          <Button variant="outline" onClick={onConfirm} disabled={busy} className="gap-2">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {details ?? null}
    </Modal>
  );
}
