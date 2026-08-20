"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  MessageCircle,
  CheckCircle2,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { submitOrder } from "@/lib/actions/order-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
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

export function Storefront({ slug, displayName, whatsapp, products }: Props) {
  const storageKey = `catalogo-cart:${slug}`;
  const currency = products[0]?.currency ?? "USD";

  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Carga/persistencia del carrito en localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* noop */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      /* noop */
    }
  }, [cart, hydrated, storageKey]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
    });
  }, [products, query, category]);

  const productById = useMemo(() => {
    const m = new Map<string, PublicProduct>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0);
  const totalItems = cartEntries.reduce((s, [, q]) => s + q, 0);
  const totalCents = cartEntries.reduce((s, [id, q]) => {
    const p = productById.get(id);
    return s + (p ? p.price_cents * q : 0);
  }, 0);

  function setQty(id: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  function addToCart(p: PublicProduct) {
    setQty(p.id, (cart[p.id] ?? 0) + Math.max(1, p.min_order_qty > 1 && !cart[p.id] ? p.min_order_qty : 1));
  }

  return (
    <>
      {/* Buscador y filtros */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar producto"
          />
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

      {/* Grid de productos */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No se encontraron productos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <li key={p.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-theme)] border border-border bg-card">
                <div className="aspect-square bg-muted">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <PackageOpen className="size-8" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{p.name}</h3>
                  <div className="mt-auto">
                    <p className="font-heading text-lg font-bold">
                      {formatMoney(p.price_cents, p.currency)}
                    </p>
                    {p.min_order_qty > 1 && (
                      <p className="text-xs text-muted-foreground">Mín. {p.min_order_qty}</p>
                    )}
                  </div>
                  {cart[p.id] ? (
                    <QtyStepper
                      qty={cart[p.id]}
                      min={p.min_order_qty}
                      onChange={(q) => setQty(p.id, q)}
                    />
                  ) : (
                    <Button size="sm" className="w-full gap-1" onClick={() => addToCart(p)}>
                      <Plus className="size-4" aria-hidden="true" /> Agregar
                    </Button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* Barra de carrito flotante */}
      {totalItems > 0 && (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-on-primary shadow-soft transition-transform hover:scale-[1.02]"
          >
            <span className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="size-5" aria-hidden="true" />
              Ver carrito ({totalItems})
            </span>
            <span className="font-heading font-bold">{formatMoney(totalCents, currency)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <CartDrawer
          slug={slug}
          displayName={displayName}
          whatsapp={whatsapp}
          currency={currency}
          entries={cartEntries.map(([id, q]) => ({ product: productById.get(id)!, qty: q }))}
          totalCents={totalCents}
          onClose={() => setCartOpen(false)}
          onSetQty={setQty}
          onClear={() => setCart({})}
        />
      )}
    </>
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
        "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-on-primary" : "border-border bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function QtyStepper({
  qty,
  min,
  onChange,
}: {
  qty: number;
  min: number;
  onChange: (q: number) => void;
}) {
  const step = Math.max(1, min);
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-theme-sm)] border border-border">
      <button
        type="button"
        aria-label="Quitar uno"
        onClick={() => onChange(qty <= step ? 0 : qty - 1)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-l-[var(--radius-theme-sm)] hover:bg-muted"
      >
        {qty <= step ? <Trash2 className="size-4" aria-hidden="true" /> : <Minus className="size-4" aria-hidden="true" />}
      </button>
      <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Agregar uno"
        onClick={() => onChange(qty + 1)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-r-[var(--radius-theme-sm)] hover:bg-muted"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function CartDrawer({
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const res = await submitOrder({
      catalogSlug: slug,
      name,
      whatsapp: phone,
      email,
      notes,
      items: entries.map((it) => ({ product_id: it.product.id, quantity: it.qty })),
    });

    if (res.ok) {
      setOrderId(res.orderId ?? "");
      setStatus("done");
      onClear();
    } else {
      setStatus("error");
      setErrorMsg(res.error ?? "Error al enviar el pedido.");
    }
  }

  // Mensaje de WhatsApp para reenviar el pedido al mayorista
  const waText = useMemo(() => {
    const lines = entries.map((it) => `• ${it.qty}x ${it.product.name}`);
    return encodeURIComponent(
      `Hola ${displayName}, quiero hacer un pedido:\n${lines.join("\n")}\n\nTotal aprox: ${formatMoney(
        totalCents,
        currency,
      )}\nNombre: ${name}`,
    );
  }, [entries, displayName, totalCents, currency, name]);

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md animate-fade-up flex-col bg-background shadow-soft">
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading text-lg font-bold">Tu pedido</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] hover:bg-muted"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        {status === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
            <h3 className="font-heading text-xl font-bold">¡Pedido enviado!</h3>
            <p className="text-muted-foreground">
              Tu pedido <span className="font-mono">#{orderId.slice(0, 8)}</span> fue registrado.
              {displayName} lo revisará pronto.
            </p>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="accent" size="lg" className="w-full gap-2">
                <MessageCircle className="size-5" aria-hidden="true" /> Avisar por WhatsApp
              </Button>
            </a>
            <Button variant="ghost" onClick={onClose}>
              Seguir viendo
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
            <ShoppingCart className="size-10" aria-hidden="true" />
            Tu carrito está vacío.
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-auto p-4">
              {entries.map(({ product, qty }) => (
                <li key={product.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(product.price_cents, currency)} c/u
                    </p>
                  </div>
                  <QtyStepper qty={qty} min={product.min_order_qty} onChange={(q) => onSetQty(product.id, q)} />
                  <span className="w-20 shrink-0 text-right text-sm font-semibold">
                    {formatMoney(product.price_cents * qty, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <form onSubmit={checkout} className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium">Total</span>
                <span className="font-heading font-bold">{formatMoney(totalCents, currency)}</span>
              </div>
              <div>
                <Label htmlFor="c-name">Tu nombre *</Label>
                <Input id="c-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-phone">WhatsApp *</Label>
                <Input
                  id="c-phone"
                  required
                  inputMode="tel"
                  minLength={5}
                  maxLength={25}
                  placeholder="+52 55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-email">Correo (opcional)</Label>
                <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-notes">Notas (opcional)</Label>
                <Textarea id="c-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {status === "error" && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {errorMsg}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Enviando…
                  </>
                ) : (
                  "Enviar pedido"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
