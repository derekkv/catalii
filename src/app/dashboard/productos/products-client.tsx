"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Upload,
  Pencil,
  Trash2,
  Loader2,
  PackageOpen,
  Search,
  EyeOff,
  X,
} from "lucide-react";
import { ProductForm } from "./product-form";
import { ImportModal } from "./import-modal";
import { deleteProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { formatMoney, cn } from "@/lib/utils";
import { productImages } from "@/lib/media/config";
import type { Product } from "@/types/database";

/** Se pintan de a tandas: con 1.000 productos renderizar todo congela el móvil. */
const PAGE_SIZE = 40;

type Visibility = "all" | "visible" | "hidden";
type SortKey = "recent" | "name" | "price-asc" | "price-desc" | "stock-asc";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Más recientes",
  name: "Nombre (A-Z)",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "stock-asc": "Menor stock primero",
};

export function ProductsClient({
  products,
  limit,
}: {
  products: Product[];
  limit: number;
}) {
  const [formFor, setFormFor] = useState<{ product?: Product } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [shown, setShown] = useState(PAGE_SIZE);

  /**
   * Cualquier cambio de filtro vuelve a la primera tanda.
   * Se hace en el handler (no en un efecto) para no provocar un render en
   * cascada: el efecto se ejecutaría después de pintar una lista inconsistente.
   */
  function applyFilter(fn: () => void) {
    fn();
    setShown(PAGE_SIZE);
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (visibility === "visible" && !p.active) return false;
      if (visibility === "hidden" && p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });

    switch (sort) {
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
      case "price-asc":
        return [...list].sort((a, b) => a.price_cents - b.price_cents);
      case "price-desc":
        return [...list].sort((a, b) => b.price_cents - a.price_cents);
      case "stock-asc":
        return [...list].sort((a, b) => a.stock - b.stock);
      default:
        return list;
    }
  }, [products, query, category, visibility, sort]);

  // Al cambiar filtros se vuelve al principio de la lista (ver applyFilter).
  const visible = filtered.slice(0, shown);
  const atLimit = Number.isFinite(limit) && products.length >= limit;
  const filtersActive = Boolean(query || category || visibility !== "all");

  return (
    <div className="space-y-5">
      {/* ── Acciones ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setFormFor({})} className="gap-2" disabled={atLimit}>
          <Plus className="size-4" aria-hidden="true" /> Nuevo producto
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2" disabled={atLimit}>
          <Upload className="size-4" aria-hidden="true" /> Importar lista
        </Button>
        {atLimit && (
          <p className="text-sm text-muted-foreground">
            Alcanzaste el límite de tu plan.{" "}
            <a href="/dashboard/facturacion" className="font-semibold text-primary hover:underline">
              Mejóralo
            </a>{" "}
            para agregar más.
          </p>
        )}
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar por nombre, SKU o categoría…"
              value={query}
              onChange={(e) => applyFilter(() => setQuery(e.target.value))}
              className={cn("pl-9", query && "pr-9")}
              aria-label="Buscar productos"
            />
            {query && (
              <button
                type="button"
                onClick={() => applyFilter(() => setQuery(""))}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <Select
              aria-label="Filtrar por categoría"
              value={category}
              onChange={(e) => applyFilter(() => setCategory(e.target.value))}
              className="sm:w-44"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
          <Select
            aria-label="Filtrar por visibilidad"
            value={visibility}
            onChange={(e) => applyFilter(() => setVisibility(e.target.value as Visibility))}
            className="sm:w-36"
          >
            <option value="all">Todos</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultos</option>
          </Select>
          <Select
            aria-label="Ordenar productos"
            value={sort}
            onChange={(e) => applyFilter(() => setSort(e.target.value as SortKey))}
            className="sm:w-48"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="rule-t rule-b flex flex-col items-center gap-4 py-14 text-center">
          <PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="t-h3">Todavía no tienes productos</p>
            <p className="t-small mt-1 text-muted-foreground">
              Agrégalos uno a uno o importa tu lista de precios en CSV o Excel.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setFormFor({})} className="gap-2">
              <Plus className="size-4" aria-hidden="true" /> Agregar el primero
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
              <Upload className="size-4" aria-hidden="true" /> Importar lista
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rule-t rule-b flex flex-col items-center gap-3 py-14 text-center">
          <Search className="size-7 text-muted-foreground" aria-hidden="true" />
          <p className="t-small text-muted-foreground">
            Ningún producto coincide con la búsqueda.
          </p>
          {filtersActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                applyFilter(() => {
                  setQuery("");
                  setCategory("");
                  setVisibility("all");
                })
              }
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="t-label text-muted-foreground" aria-live="polite">
            {filtered.length === products.length
              ? `${products.length} productos`
              : `${filtered.length} de ${products.length}`}
          </p>

          {/* Registro de inventario: una línea por producto, con reglas de
              pelo. Se escanea en columna como una lista de precios impresa. */}
          <ul className="border-y border-border">
            {visible.map((p, i) => (
              <ProductRow
                key={p.id}
                product={p}
                ruled={i > 0}
                onEdit={() => setFormFor({ product: p })}
              />
            ))}
          </ul>

          {shown < filtered.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Mostrar más ({filtered.length - shown} restantes)
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Formulario en panel lateral (la lista no desaparece) ──────────── */}
      <Drawer
        open={formFor !== null}
        onClose={() => setFormFor(null)}
        title={formFor?.product ? "Editar producto" : "Nuevo producto"}
        description={
          formFor?.product
            ? "Los cambios se reflejan en todos tus catálogos."
            : "Solo el nombre y el precio son obligatorios."
        }
      >
        <div className="p-4">
          {formFor && (
            <ProductForm
              key={formFor.product?.id ?? "new"}
              product={formFor.product}
              onDone={() => setFormFor(null)}
            />
          )}
        </div>
      </Drawer>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function ProductRow({
  product: p,
  ruled,
  onEdit,
}: {
  product: Product;
  ruled: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const cover = productImages(p)[0];

  async function remove() {
    const ok = await confirm({
      title: `¿Eliminar "${p.name}"?`,
      description:
        "Se quitará de todos tus catálogos. Los pedidos ya recibidos conservan el nombre y el precio histórico.",
      confirmLabel: "Eliminar producto",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const result = await deleteProduct(p.id);
      if (!result.ok) {
        toast(result.error ?? "No se pudo eliminar el producto.", { tone: "error" });
        return;
      }
      toast(`"${p.name}" eliminado.`, { tone: "success" });
      router.refresh();
    } catch {
      // Fallo de red o de ejecución de la acción; los errores de negocio
      // llegan en `result.error`.
      toast("No se pudo eliminar el producto. Revisa tu conexión.", { tone: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 py-2.5",
        ruled && "rule-t",
        deleting && "opacity-45",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.thumb} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <PackageOpen className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 cursor-pointer text-left"
        aria-label={`Editar ${p.name}`}
      >
        <span className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium">{p.name}</span>
          {!p.active && (
            <span className="t-label shrink-0 text-muted-foreground">
              <EyeOff className="inline size-3" aria-hidden="true" /> Oculto
            </span>
          )}
        </span>
        <span className="t-label mt-1 block truncate text-muted-foreground">
          {p.sku ? `${p.sku} · ` : ""}
          {p.stock > 0 ? `${p.stock} en stock` : "stock no controlado"}
          {p.category ? ` · ${p.category}` : ""}
        </span>
      </button>

      {/* El precio en su propia columna, alineado a la derecha y en mono:
          así las cifras forman columna y se comparan de un vistazo. */}
      <span className="t-price w-24 shrink-0 text-right text-sm">
        {formatMoney(p.price_cents, p.currency)}
      </span>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${p.name}`}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          aria-label={`Eliminar ${p.name}`}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-destructive hover:text-on-destructive disabled:cursor-not-allowed"
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </li>
  );
}
