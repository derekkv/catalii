"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Loader2,
  PackageOpen,
  SlidersHorizontal,
  X,
  Info,
} from "lucide-react";
import { submitOrder } from "@/lib/actions/order-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Drawer, Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { formatMoney, cn } from "@/lib/utils";

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  min_order_qty: number;
  image_url: string | null;
}

interface Props {
  slug: string;
  displayName: string;
  whatsapp: string | null;
  products: PublicProduct[];
}

type Cart = Record<string, number>;
type SortKey = "default" | "price-asc" | "price-desc" | "name-asc";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Orden del catálogo",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "name-asc": "Nombre (A-Z)",
};

/** Umbral para avisar "quedan pocas". `stock = 0` se trata como "no controlado". */
const LOW_STOCK_THRESHOLD = 10;

/** Cantidad máxima permitida: limitada por stock sólo si el stock se controla. */
function maxQtyFor(p: PublicProduct): number {
  return p.stock > 0 ? p.stock : Number.POSITIVE_INFINITY;
}

export function Storefront({ slug, displayName, whatsapp, products }: Props) {
  const storageKey = `catalii-cart:${slug}`;
  const { toast } = useToast();

  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<PublicProduct | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const productById = useMemo(() => {
    const m = new Map<string, PublicProduct>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  // Mezcla de monedas: el total de un pedido sólo tiene sentido en una moneda.
  // Si el catálogo tiene varias, se avisa y se usa la primera como referencia.
  const currencies = useMemo(
    () => Array.from(new Set(products.map((p) => p.currency))),
    [products],
  );
  const currency = currencies[0] ?? "USD";

  // ── Carrito persistente ───────────────────────────────────────────────────
  // Al rehidratar se saneea: se descartan productos que ya no existen en el
  // catálogo y se recortan cantidades por encima del stock disponible.
  useEffect(() => {
    let restored: Cart = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object") {
          for (const [id, qty] of Object.entries(parsed as Record<string, unknown>)) {
            const product = productById.get(id);
            const n = Number(qty);
            if (!product || !Number.isFinite(n) || n <= 0) continue;
            restored[id] = Math.min(Math.floor(n), maxQtyFor(product));
          }
        }
      }
    } catch {
      restored = {};
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(restored);
    setHydrated(true);
  }, [storageKey, productById]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      /* modo privado o cuota llena: el carrito sigue funcionando en memoria */
    }
  }, [cart, hydrated, storageKey]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });

    if (sort === "price-asc") return [...list].sort((a, b) => a.price_cents - b.price_cents);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price_cents - a.price_cents);
    if (sort === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [products, query, category, sort]);

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([id, qty]) => qty > 0 && productById.has(id))
        .map(([id, qty]) => ({ product: productById.get(id)!, qty })),
    [cart, productById],
  );
  const totalItems = cartEntries.reduce((s, it) => s + it.qty, 0);
  const totalCents = cartEntries.reduce((s, it) => s + it.product.price_cents * it.qty, 0);

  const setQty = useCallback(
    (id: string, qty: number) => {
      setCart((prev) => {
        const next = { ...prev };
        const product = productById.get(id);
        const max = product ? maxQtyFor(product) : Number.POSITIVE_INFINITY;
        const clamped = Math.min(qty, max);
        if (clamped <= 0) delete next[id];
        else next[id] = clamped;
        return next;
      });
    },
    [productById],
  );

  const addToCart = useCallback(
    (p: PublicProduct, qty?: number) => {
      const current = cart[p.id] ?? 0;
      // Primera unidad: respeta el mínimo de compra del mayorista.
      const amount = qty ?? (current === 0 ? Math.max(1, p.min_order_qty) : 1);
      const next = Math.min(current + amount, maxQtyFor(p));
      setQty(p.id, next);
      if (next === current && current > 0) {
        toast(`Solo quedan ${p.stock} de ${p.name}.`, { tone: "info" });
      } else {
        toast(`${p.name} agregado (${next}).`, { tone: "success", duration: 2200 });
      }
    },
    [cart, setQty, toast],
  );

  const filtersActive = Boolean(query || category || sort !== "default");

  function clearFilters() {
    setQuery("");
    setCategory("");
    setSort("default");
  }

  return (
    <>
      {/* ── Buscador, categorías y orden ──────────────────────────────────── */}
      <div className="sticky top-[var(--catalog-header-h)] z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2">
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
              aria-label="Buscar producto"
            />
          </div>
          <label className="relative inline-flex shrink-0">
            <span className="sr-only">Ordenar productos</span>
            <SlidersHorizontal
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="t-label h-11 cursor-pointer appearance-none rounded-[var(--radius-theme-sm)] border border-input bg-card pl-9 pr-3 text-card-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--ring)_28%,transparent)]"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {categories.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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

      {currencies.length > 1 && (
        <p
          role="status"
          className="t-small mt-4 flex items-start gap-2 border-l-2 border-accent bg-muted px-3 py-2.5 text-muted-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Este catálogo mezcla monedas ({currencies.join(", ")}). El total es una referencia en{" "}
          {currency}; confirma el importe final con {displayName}.
        </p>
      )}

      {/* Recuento de resultados: feedback inmediato al buscar/filtrar. */}
      <p className="t-label pt-5 text-muted-foreground" aria-live="polite">
        {filtered.length === products.length
          ? `${products.length} ${products.length === 1 ? "producto" : "productos"}`
          : `${filtered.length} de ${products.length}`}
      </p>

      {/* ── Grid de productos ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <PackageOpen className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No encontramos productos con esos filtros.</p>
          {filtersActive && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="size-4" aria-hidden="true" /> Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              qty={cart[p.id] ?? 0}
              onAdd={() => addToCart(p)}
              onSetQty={(q) => setQty(p.id, q)}
              onOpenDetail={() => setDetail(p)}
            />
          ))}
        </ul>
      )}

      {/* ── Barra de carrito flotante ─────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto flex w-full max-w-md cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-theme-sm)] bg-primary px-5 py-3.5 text-on-primary shadow-lift transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
          >
            <span className="t-label flex items-center gap-2">
              <ShoppingCart className="size-4" aria-hidden="true" />
              Ver pedido · {totalItems}
            </span>
            <span className="t-price text-base">{formatMoney(totalCents, currency)}</span>
          </button>
        </div>
      )}

      {/* ── Detalle del producto ──────────────────────────────────────────── */}
      {detail && (
        <ProductDetail
          key={detail.id}
          product={detail}
          qty={cart[detail.id] ?? 0}
          onClose={() => setDetail(null)}
          onAdd={(qty) => {
            addToCart(detail, qty);
            setDetail(null);
          }}
        />
      )}

      {/* ── Carrito / checkout ────────────────────────────────────────────── */}
      <CartDrawer
        open={cartOpen}
        slug={slug}
        displayName={displayName}
        whatsapp={whatsapp}
        currency={currency}
        entries={cartEntries}
        totalCents={totalCents}
        onClose={() => setCartOpen(false)}
        onSetQty={setQty}
        onClear={() => setCart({})}
      />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tarjeta de producto
 * ────────────────────────────────────────────────────────────────────────── */

function ProductCard({
  product: p,
  qty,
  onAdd,
  onSetQty,
  onOpenDetail,
}: {
  product: PublicProduct;
  qty: number;
  onAdd: () => void;
  onSetQty: (q: number) => void;
  onOpenDetail: () => void;
}) {
  const lowStock = p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
  const hasDetail = Boolean(p.description || p.image_url || p.category);

  return (
    <li>
      <article className="flex h-full flex-col border border-border bg-card">
        {/* Toda la zona de imagen + nombre abre el detalle: es el patrón que
            esperan los compradores y permite leer la descripción (antes
            inaccesible desde el catálogo). */}
        <button
          type="button"
          onClick={onOpenDetail}
          disabled={!hasDetail}
          className={cn("group block text-left", hasDetail ? "cursor-pointer" : "cursor-default")}
          aria-label={hasDetail ? `Ver detalle de ${p.name}` : undefined}
        >
          <div className="relative aspect-square overflow-hidden border-b border-border bg-muted">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_url}
                alt={p.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <PackageOpen className="size-7" aria-hidden="true" />
              </div>
            )}
            {lowStock && (
              <span className="t-label absolute left-0 top-0 bg-accent px-2 py-1 text-on-accent">
                Quedan {p.stock}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 px-3 pt-3 text-[0.8125rem] font-medium leading-snug">
            {p.name}
          </h3>
        </button>

        <div className="flex flex-1 flex-col gap-2.5 p-3 pt-2">
          <div className="mt-auto">
            {/* Precio en mono: en una rejilla, las cifras forman columna. */}
            <p className="t-price text-lg leading-none">
              {formatMoney(p.price_cents, p.currency)}
            </p>
            {p.min_order_qty > 1 && (
              <p className="t-label mt-1.5 text-muted-foreground">Mín. {p.min_order_qty}</p>
            )}
          </div>

          {qty > 0 ? (
            <QtyStepper
              qty={qty}
              min={p.min_order_qty}
              max={maxQtyFor(p)}
              label={p.name}
              onChange={onSetQty}
            />
          ) : (
            <Button size="sm" className="w-full gap-1.5" onClick={onAdd}>
              <Plus className="size-3.5" aria-hidden="true" /> Agregar
            </Button>
          )}
        </div>
      </article>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Detalle del producto
 * ────────────────────────────────────────────────────────────────────────── */

function ProductDetail({
  product,
  qty,
  onClose,
  onAdd,
}: {
  product: PublicProduct;
  qty: number;
  onClose: () => void;
  onAdd: (qty: number) => void;
}) {
  // El componente se monta con `key={product.id}`, así que el estado inicial
  // basta: no hace falta un efecto para resincronizar al cambiar de producto.
  const [amount, setAmount] = useState(() => Math.max(1, product.min_order_qty));
  const max = maxQtyFor(product);

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      description={product.category ?? undefined}
      footer={
        <>
          <span className="t-price mr-auto text-xl">
            {formatMoney(product.price_cents * amount, product.currency)}
          </span>
          <Button onClick={() => onAdd(amount)} className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            {qty > 0 ? "Sumar al pedido" : "Agregar al pedido"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full border border-border bg-muted object-contain"
          />
        )}

        <p className="t-price text-3xl">
          {formatMoney(product.price_cents, product.currency)}
          <span className="t-label ml-2 text-muted-foreground">c/u</span>
        </p>

        {product.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-y-2 border-y border-border py-3 text-[0.8125rem]">
          {product.stock > 0 && (
            <>
              <dt className="t-label text-muted-foreground">Disponibles</dt>
              <dd className="t-num text-right">{product.stock}</dd>
            </>
          )}
          {product.min_order_qty > 1 && (
            <>
              <dt className="t-label text-muted-foreground">Pedido mínimo</dt>
              <dd className="t-num text-right">{product.min_order_qty}</dd>
            </>
          )}
          {qty > 0 && (
            <>
              <dt className="t-label text-muted-foreground">Ya en tu pedido</dt>
              <dd className="t-num text-right">{qty}</dd>
            </>
          )}
        </dl>

        <div>
          <p className="t-label mb-2 text-muted-foreground">Cantidad a agregar</p>
          <QtyStepper
            qty={amount}
            min={1}
            max={max}
            label={product.name}
            allowZero={false}
            onChange={setAmount}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Controles
 * ────────────────────────────────────────────────────────────────────────── */

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
        "shrink-0 cursor-pointer whitespace-nowrap border px-3 py-1.5 transition-colors",
        "t-label rounded-[var(--radius-theme-sm)]",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function QtyStepper({
  qty,
  min,
  max,
  label,
  allowZero = true,
  onChange,
}: {
  qty: number;
  min: number;
  max: number;
  label: string;
  allowZero?: boolean;
  onChange: (q: number) => void;
}) {
  const floor = Math.max(1, min);
  const atFloor = qty <= floor;
  const atMax = qty >= max;

  function decrease() {
    if (!atFloor) return onChange(qty - 1);
    if (allowZero) return onChange(0);
  }

  return (
    <div className="flex items-stretch border border-input">
      <button
        type="button"
        aria-label={atFloor && allowZero ? `Quitar ${label} del pedido` : `Quitar una unidad de ${label}`}
        onClick={decrease}
        disabled={atFloor && !allowZero}
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
      >
        {atFloor && allowZero ? (
          <Trash2 className="size-3.5" aria-hidden="true" />
        ) : (
          <Minus className="size-3.5" aria-hidden="true" />
        )}
      </button>
      <span className="t-num flex flex-1 items-center justify-center border-x border-input text-sm">
        <span className="sr-only">{label}: </span>
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Agregar una unidad de ${label}`}
        onClick={() => onChange(qty + 1)}
        disabled={atMax}
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Carrito + checkout
 * ────────────────────────────────────────────────────────────────────────── */

function CartDrawer({
  open,
  slug,
  displayName,
  whatsapp,
  currency,
  entries,
  totalCents,
  onClose,
  onSetQty,
  onClear,
}: {
  open: boolean;
  slug: string;
  displayName: string;
  whatsapp: string | null;
  currency: string;
  entries: { product: PublicProduct; qty: number }[];
  totalCents: number;
  onClose: () => void;
  onSetQty: (id: string, q: number) => void;
  onClear: () => void;
}) {
  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "" });
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");
  const [sentSummary, setSentSummary] = useState<{ lines: string[]; total: number }>({
    lines: [],
    total: 0,
  });
  const { toast } = useToast();
  const errorRef = useRef<HTMLParagraphElement>(null);

  const { name, phone, email } = buyer;

  // Los datos del comprador se recuerdan: en mayoreo el mismo cliente vuelve a
  // pedir cada semana y volver a teclear nombre/teléfono es la fricción #1.
  // Se lee tras la hidratación para no provocar desajuste con el HTML del SSR.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("catalii-buyer");
      if (!raw) return;
      const d = JSON.parse(raw) as { name?: string; phone?: string; email?: string };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuyer({ name: d.name ?? "", phone: d.phone ?? "", email: d.email ?? "" });
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const summary = {
      lines: entries.map((it) => `• ${it.qty}x ${it.product.name}`),
      total: totalCents,
    };

    const res = await submitOrder({
      catalogSlug: slug,
      name,
      whatsapp: phone,
      email,
      notes,
      items: entries.map((it) => ({ product_id: it.product.id, quantity: it.qty })),
    });

    if (res.ok) {
      try {
        localStorage.setItem("catalii-buyer", JSON.stringify({ name, phone, email }));
      } catch {
        /* noop */
      }
      setSentSummary(summary);
      setOrderId(res.orderId ?? "");
      setStatus("done");
      onClear();
      toast("Pedido enviado correctamente.", { tone: "success" });
    } else {
      setStatus("error");
      setErrorMsg(res.error ?? "Error al enviar el pedido.");
      // Lleva el foco al error: si no, en móvil queda fuera de pantalla.
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  const waText = useMemo(() => {
    const lines =
      sentSummary.lines.length > 0
        ? sentSummary.lines
        : entries.map((it) => `• ${it.qty}x ${it.product.name}`);
    const total = sentSummary.lines.length > 0 ? sentSummary.total : totalCents;
    return encodeURIComponent(
      `Hola ${displayName}, acabo de enviar un pedido${orderId ? ` (#${orderId.slice(0, 8)})` : ""}:\n` +
        `${lines.join("\n")}\n\nTotal aprox: ${formatMoney(total, currency)}\nNombre: ${name}`,
    );
  }, [entries, sentSummary, displayName, totalCents, currency, name, orderId]);

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  function close() {
    onClose();
    // Permite enviar otro pedido sin recargar la página.
    if (status === "done") setStatus("idle");
  }

  // ── Confirmación ──────────────────────────────────────────────────────────
  if (status === "done") {
    return (
      <Drawer open={open} onClose={close} title="Pedido enviado">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
          <h3 className="t-h2">Pedido registrado</h3>
          <p className="text-muted-foreground">
            Folio <span className="t-num text-foreground">{orderId.slice(0, 8)}</span>.{" "}
            {displayName} lo revisará pronto.
          </p>
          <p className="text-sm text-muted-foreground">
            Avisar por WhatsApp acelera la respuesta.
          </p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="accent" size="lg" className="w-full gap-2">
              <MessageCircle className="size-5" aria-hidden="true" /> Avisar por WhatsApp
            </Button>
          </a>
          <Button variant="ghost" onClick={close}>
            Seguir viendo el catálogo
          </Button>
        </div>
      </Drawer>
    );
  }

  // ── Carrito vacío ─────────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <Drawer open={open} onClose={close} title="Tu pedido">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
          <ShoppingCart className="size-10" aria-hidden="true" />
          <p>Tu pedido está vacío.</p>
          <Button variant="outline" onClick={close}>
            Ver productos
          </Button>
        </div>
      </Drawer>
    );
  }

  const totalUnits = entries.reduce((s, it) => s + it.qty, 0);

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Tu pedido"
      description={`${entries.length} ${entries.length === 1 ? "producto" : "productos"} · ${totalUnits} ${
        totalUnits === 1 ? "unidad" : "unidades"
      }`}
    >
      <ul className="divide-y divide-border p-4">
        {entries.map(({ product, qty }) => (
          <li key={product.id} className="flex flex-col gap-2 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-medium">{product.name}</p>
                <p className="t-label mt-1 text-muted-foreground">
                  {formatMoney(product.price_cents, product.currency)} c/u
                </p>
              </div>
              <span className="t-price shrink-0 text-sm">
                {formatMoney(product.price_cents * qty, product.currency)}
              </span>
            </div>
            <div className="w-36">
              <QtyStepper
                qty={qty}
                min={product.min_order_qty}
                max={maxQtyFor(product)}
                label={product.name}
                onChange={(q) => onSetQty(product.id, q)}
              />
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={checkout} className="space-y-3 border-t border-border p-4">
        <div className="flex items-baseline justify-between rule-b pb-3">
          <span className="t-label text-muted-foreground">Total del pedido</span>
          <span className="t-price text-xl">{formatMoney(totalCents, currency)}</span>
        </div>
        <p className="t-small text-muted-foreground">
          El total es estimado; {displayName} confirma envío y forma de pago.
        </p>

        <div>
          <Label htmlFor="c-name">Tu nombre *</Label>
          <Input
            id="c-name"
            required
            autoComplete="name"
            maxLength={120}
            value={name}
            onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="c-phone">WhatsApp *</Label>
          <Input
            id="c-phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            minLength={5}
            maxLength={25}
            placeholder="+52 55 1234 5678"
            value={phone}
            onChange={(e) => setBuyer((b) => ({ ...b, phone: e.target.value }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Es el número por el que te contactaremos.
          </p>
        </div>
        <div>
          <Label htmlFor="c-email">Correo (opcional)</Label>
          <Input
            id="c-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="c-notes">Notas (opcional)</Label>
          <Textarea
            id="c-notes"
            maxLength={1000}
            placeholder="Dirección de entrega, horario preferido…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {status === "error" && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="border-l-2 border-destructive bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-3 py-2 text-[0.8125rem] font-medium text-destructive outline-none"
          >
            {errorMsg}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Enviando…
            </>
          ) : (
            `Enviar pedido · ${formatMoney(totalCents, currency)}`
          )}
        </Button>
      </form>
    </Drawer>
  );
}
