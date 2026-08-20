"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Product } from "@/types/database";

const initial: ActionState = { ok: false };

export function ProductForm({
  product,
  onDone,
}: {
  product?: Product;
  onDone?: () => void;
}) {
  const isEdit = Boolean(product);
  const [state, action, pending] = useActionState(
    isEdit ? updateProduct : createProduct,
    initial,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onDone?.();
    }
  }, [state.ok, router, onDone]);

  return (
    <form action={action} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      <div>
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" required maxLength={200} defaultValue={product?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sku">SKU / Código</Label>
          <Input id="sku" name="sku" maxLength={60} defaultValue={product?.sku ?? ""} />
        </div>
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Input id="category" name="category" maxLength={80} defaultValue={product?.category ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Precio *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""}
          />
        </div>
        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" name="currency" maxLength={3} defaultValue={product?.currency ?? "USD"} />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="min_order_qty">Mínimo por pedido</Label>
          <Input
            id="min_order_qty"
            name="min_order_qty"
            type="number"
            min="1"
            defaultValue={product?.min_order_qty ?? 1}
          />
        </div>
        <div>
          <Label htmlFor="image_url">URL de imagen</Label>
          <Input id="image_url" name="image_url" type="url" defaultValue={product?.image_url ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" maxLength={2000} defaultValue={product?.description ?? ""} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={product ? product.active : true}
          className="size-4 accent-[var(--primary)]"
        />
        Visible en el catálogo
      </label>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isEdit ? "Guardar cambios" : "Agregar producto"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
