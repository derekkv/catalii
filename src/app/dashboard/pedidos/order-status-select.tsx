"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrderStatus } from "./actions";
import type { OrderStatus } from "@/types/database";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "shipped", label: "Enviado" },
  { value: "cancelled", label: "Cancelado" },
];

export function OrderStatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Cambiar estado del pedido"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", e.target.value);
        startTransition(async () => {
          await updateOrderStatus(fd);
          router.refresh();
        });
      }}
      className="h-9 cursor-pointer rounded-[var(--radius-theme-sm)] border border-border bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
