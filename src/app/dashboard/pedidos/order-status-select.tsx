"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatus } from "./actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "shipped", label: "Enviado" },
  { value: "cancelled", label: "Cancelado" },
];

/** Color por estado: permite escanear la lista sin leer cada etiqueta. */
const TONE: Record<OrderStatus, string> = {
  pending: "border-accent text-accent",
  confirmed: "border-primary text-primary",
  shipped: "border-success text-success",
  cancelled: "border-destructive text-destructive",
};

export function OrderStatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Estado optimista: el select refleja el cambio antes del round-trip.
  const [value, setValue] = useState<OrderStatus>(status);
  const { toast } = useToast();

  function change(next: OrderStatus) {
    const previous = value;
    setValue(next);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next);
    startTransition(async () => {
      try {
        await updateOrderStatus(fd);
        toast(`Pedido marcado como “${OPTIONS.find((o) => o.value === next)?.label}”.`, {
          tone: "success",
          duration: 2500,
        });
        router.refresh();
      } catch {
        setValue(previous);
        toast("No se pudo cambiar el estado del pedido.", { tone: "error" });
      }
    });
  }

  return (
    <span className="relative inline-flex items-center">
      <label className="sr-only" htmlFor={`status-${id}`}>
        Estado del pedido
      </label>
      <select
        id={`status-${id}`}
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value as OrderStatus)}
        className={cn(
          "t-label h-9 cursor-pointer appearance-none border-l-2 bg-transparent pl-2.5 pr-6",
          "transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--ring)_28%,transparent)]",
          "disabled:cursor-wait disabled:opacity-60",
          TONE[value],
        )}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending && (
        <Loader2
          className="pointer-events-none absolute right-2 size-3.5 animate-spin"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
