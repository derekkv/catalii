"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, PackageOpen, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { productImages } from "@/lib/media/config";
import { cn, formatMoney } from "@/lib/utils";
import type { StoredImage } from "@/types/database";

/**
 * Escaparate de productos del negocio.
 *
 * **Aquí no hay carrito a propósito.** El pedido vive en el catálogo: es donde
 * está el precio que aplica, el mínimo de compra y el WhatsApp al que llega.
 * Un carrito en la página del negocio tendría que decidir a qué catálogo
 * pertenece cada línea y podría mezclar listas con precios distintos.
 *
 * Tampoco hay ficha de detalle: una segunda ficha sin botón de pedido es un
 * callejón sin salida ("qué bonito, ¿y ahora qué?"). Cada tarjeta es un
 * enlace al catálogo que contiene el producto, que es el siguiente paso real.
 */
export interface ShowcaseProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  images: StoredImage[];
  /** Catálogo público donde se puede pedir (el primero, si está en varios). */
  catalogSlug: string;
  catalogName: string;
}

export function BusinessProducts({ products }: { products: ShowcaseProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  const filtersActive = Boolean(query || category);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn("pl-9", query && "pr-9")}
            aria-label="Buscar entre los productos del negocio"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categorías">
            <Chip active={category === ""} onClick={() => setCategory("")}>
              Todo
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <p className="t-label pt-4 text-muted-foreground" aria-live="polite">
        {filtered.length === products.length
          ? `${products.length} ${products.length === 1 ? "producto" : "productos"}`
          : `${filtered.length} de ${products.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <PackageOpen className="size-9 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No encontramos productos con esos filtros.</p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("");
              }}
              className="t-label inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius-theme-sm)] border border-input px-3 text-foreground transition-colors hover:bg-muted"
            >
              <X className="size-3.5" aria-hidden="true" /> Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ShowcaseCard key={p.id} product={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ShowcaseCard({ product: p }: { product: ShowcaseProduct }) {
  const cover = productImages(p)[0];

  return (
    <li>
      <article className="h-full border border-border bg-card transition-colors hover:border-input">
        {/* Toda la tarjeta es un enlace: el único siguiente paso posible es
            abrir el catálogo donde este producto se puede pedir. */}
        <Link
          href={`/c/${p.catalogSlug}`}
          className="group flex h-full flex-col"
        >
          <div className="aspect-square overflow-hidden border-b border-border bg-muted">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover.thumb}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <PackageOpen className="size-7" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3">
            <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug">{p.name}</h3>
            <p className="t-price mt-auto text-lg leading-none">
              {formatMoney(p.price_cents, p.currency)}
            </p>
            <p className="t-label flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
              <span className="truncate">Pedir en {p.catalogName}</span>
              <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
            </p>
          </div>
        </Link>
      </article>
    </li>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "t-label shrink-0 cursor-pointer whitespace-nowrap rounded-[var(--radius-theme-sm)] border px-3 py-1.5 transition-colors",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
