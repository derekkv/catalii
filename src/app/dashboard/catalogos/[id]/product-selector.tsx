"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Search, EyeOff, PackageOpen } from "lucide-react";
import Link from "next/link";
import { syncCatalogProducts } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatMoney, cn } from "@/lib/utils";
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (onlySelected && !selected.has(p.id)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category, onlySelected, selected]);

  // Hay cambios sin guardar: señal clara para evitar salir perdiendo el trabajo.
  const dirty = useMemo(() => {
    if (selected.size !== selectedIds.length) return true;
    return selectedIds.some((id) => !selected.has(id));
  }, [selected, selectedIds]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Aplica a los productos actualmente filtrados, no a todo el inventario. */
  function toggleFiltered(select: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((p) => (select ? next.add(p.id) : next.delete(p.id)));
      return next;
    });
  }

  function save() {
    const fd = new FormData();
    fd.set("catalog_id", catalogId);
    selected.forEach((id) => fd.append("product_ids", id));
    startTransition(async () => {
      try {
        await syncCatalogProducts(fd);
        toast(
          `Catálogo actualizado con ${selected.size} ${selected.size === 1 ? "producto" : "productos"}.`,
          { tone: "success" },
        );
        router.refresh();
      } catch {
        toast("No se pudo guardar la selección.", { tone: "error" });
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No tienes productos todavía. Agrégalos para poder incluirlos aquí.
        </p>
        <Link href="/dashboard/productos">
          <Button variant="outline">Ir a Productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador: imprescindible: con cientos de productos la lista con scroll
          de antes era inservible. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar productos para el catálogo"
          />
        </div>
        {categories.length > 0 && (
          <Select
            aria-label="Filtrar por categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="sm:w-44"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => toggleFiltered(true)}>
          Incluir {filtered.length === products.length ? "todos" : "los filtrados"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => toggleFiltered(false)}>
          Quitar {filtered.length === products.length ? "todos" : "los filtrados"}
        </Button>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlySelected}
            onChange={(e) => setOnlySelected(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Solo incluidos
        </label>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">{selected.size}</span> de {products.length}{" "}
        productos incluidos
        {filtered.length !== products.length && ` · ${filtered.length} visibles`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-theme-sm)] border border-border p-6 text-center text-sm text-muted-foreground">
          Ningún producto coincide con la búsqueda.
        </p>
      ) : (
        <ul className="max-h-96 divide-y divide-border overflow-auto overscroll-contain rounded-[var(--radius-theme-sm)] border border-border">
          {filtered.map((p) => {
            const checked = selected.has(p.id);
            return (
              <li key={p.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted",
                    checked && "bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.sku ? `${p.sku} · ` : ""}
                      {formatMoney(p.price_cents, p.currency)}
                      {p.category ? ` · ${p.category}` : ""}
                    </span>
                  </span>
                  {!p.active && (
                    <span
                      className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                      title="Oculto: no se mostrará aunque esté incluido"
                    >
                      <EyeOff className="size-3.5" aria-hidden="true" /> Oculto
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || !dirty} className="gap-2">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Guardar selección
        </Button>
        {dirty ? (
          <span className="text-sm font-medium text-accent">Tienes cambios sin guardar</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Check className="size-4 text-primary" aria-hidden="true" /> Todo guardado
          </span>
        )}
      </div>
    </div>
  );
}
