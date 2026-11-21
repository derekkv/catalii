"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BillingConfirmDialog } from "./confirm-dialog";
import { cancelSubscriptionAction } from "./actions";

export function CancelSubscriptionButton({ nextBilledAt }: { nextBilledAt: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const until = nextBilledAt
    ? new Date(nextBilledAt).toLocaleDateString("es-EC", { dateStyle: "long" })
    : null;

  function confirm() {
    startTransition(async () => {
      const res = await cancelSubscriptionAction();
      setOpen(false);
      if (res.ok) {
        toast(res.message, { tone: "success" });
        router.refresh();
      } else {
        toast(res.error, { tone: "error" });
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Cancelar suscripción
      </Button>
      <BillingConfirmDialog
        open={open}
        title="¿Cancelar tu suscripción?"
        description={
          until
            ? `No se te volverá a cobrar. Conservas tu plan hasta el final del periodo ya pagado (próximo cobro previsto: ${until}); después tu cuenta pasará al plan Gratis.`
            : "No se te volverá a cobrar. Conservas tu plan hasta el final del periodo ya pagado; después tu cuenta pasará al plan Gratis."
        }
        keepLabel="Mantener plan"
        confirmLabel="Cancelar plan"
        busy={pending}
        onKeep={() => setOpen(false)}
        onConfirm={confirm}
      />
    </>
  );
}
