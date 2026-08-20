"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Pencil, Trash2, Loader2, PackageOpen } from "lucide-react";
import { ProductForm } from "./product-form";
import { importProductsCsv, deleteProduct, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/types/database";

const initial: ActionState = { ok: false };

export function ProductsClient({ products }: { products: Product[] }) {
  const [mode, setMode] = useState<"list" | "new">("list");
  const [editing, setEditing] = useState<Product | null>(null);

  if (editing) {
    return (
      <Card className="animate-fade-up">
        <CardContent className="p-5">
          <h2 className="mb-4 font-heading text-lg font-bold">Editar producto</h2>
          <ProductForm product={editing} onDone={() => setEditing(null)} />
        </CardContent>
      </Card>
    );
  }

  if (mode === "new") {
    return (
      <Card className="animate-fade-up">
        <CardContent className="p-5">
          <h2 className="mb-4 font-heading text-lg font-bold">Nuevo producto</h2>
          <ProductForm onDone={() => setMode("list")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setMode("new")} className="gap-2">
          <Plus className="size-4" aria-hidden="true" /> Nuevo producto
        </Button>
        <CsvImport />
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <PackageOpen className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">
              Aún no tienes productos. Agrégalos manualmente o importa un CSV.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-theme-sm)] bg-muted">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <PackageOpen className="size-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.sku ? `${p.sku} · ` : ""}
                    {formatMoney(p.price_cents, p.currency)} · Stock: {p.stock}
                  </p>
                </div>
                {!p.active && <Badge tone="muted">Oculto</Badge>}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    aria-label={`Editar ${p.name}`}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <DeleteButton id={p.id} name={p.name} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function DeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <form
      action={async (fd) => {
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
        await deleteProduct(fd);
        router.refresh();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Eliminar ${name}`}
        className="flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground hover:bg-destructive hover:text-on-destructive"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function CsvImport() {
  const [state, action, pending] = useActionState(importProductsCsv, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-theme-sm)] border border-border bg-card px-4 text-sm font-medium hover:bg-muted">
        <Upload className="size-4" aria-hidden="true" />
        <span>Elegir CSV</span>
        <input type="file" name="file" accept=".csv,text/csv" className="sr-only" required />
      </label>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Importar
      </Button>
      {state.error && <span className="text-sm text-destructive">{state.error}</span>}
      {state.ok && state.message && <span className="text-sm text-primary">{state.message}</span>}
    </form>
  );
}
