"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { syncCatalogProducts } from "../actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/types/database";

export function ProductSelector({
  catalogId,
  products,
  selectedIds,
}: {
  catalogId: string;
  products: Product[];
  selectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSaved(false);
    setSelected(new Set(products.map((p) => p.id)));
  }

  function save() {
    const fd = new FormData();
    fd.set("catalog_id", catalogId);
    selected.forEach((id) => fd.append("product_ids", id));
    startTransition(async () => {
      await syncCatalogProducts(fd);
      setSaved(true);
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes productos todavía. Agrégalos en la sección Productos.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll}>
          Seleccionar todos
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setSelected(new Set())}>
          Ninguno
        </Button>
        <span className="text-sm text-muted-foreground">{selected.size} seleccionados</span>
      </div>

      <ul className="max-h-80 divide-y divide-border overflow-auto rounded-[var(--radius-theme-sm)] border border-border">
        {products.map((p) => {
          const checked = selected.has(p.id);
          return (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatMoney(p.price_cents, p.currency)}
                    {!p.active && " · oculto"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar selección
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-primary">
            <Check className="size-4" aria-hidden="true" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
