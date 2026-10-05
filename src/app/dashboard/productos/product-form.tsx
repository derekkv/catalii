"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError, FieldHint } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/types/database";

const initial: ActionState = { ok: false };

/** Monedas habituales en LATAM; el campo acepta cualquier ISO-4217 de 3 letras. */
const CURRENCIES = ["USD", "MXN", "COP", "ARS", "CLP", "PEN", "GTQ", "DOP", "EUR"];

export function ProductForm({
  product,
  onDone,
}: {
  product?: Product;
  onDone?: () => void;
}) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const { toast } = useToast();

  // Los efectos del éxito se encadenan dentro de la acción (ver nota en
  // products-client): nada de observar el estado resultante desde un efecto.
  const [state, action, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await (isEdit ? updateProduct : createProduct)(prev, formData);
      if (result.ok) {
        toast(result.message ?? (isEdit ? "Producto actualizado." : "Producto agregado."), {
          tone: "success",
        });
        router.refresh();
        onDone?.();
      }
      return result;
    },
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      <div>
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          name="name"
          required
          autoFocus
          maxLength={200}
          placeholder="Coca-Cola 600 ml"
          defaultValue={product?.name}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sku">SKU / Código</Label>
          <Input
            id="sku"
            name="sku"
            maxLength={60}
            placeholder="CC600"
            defaultValue={product?.sku ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            name="category"
            maxLength={80}
            placeholder="Bebidas"
            defaultValue={product?.category ?? ""}
          />
          <FieldHint>
            Agrupa productos en filtros del catálogo.
          </FieldHint>
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
            inputMode="decimal"
            required
            placeholder="12.50"
            defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""}
          />
        </div>
        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Select id="currency" name="currency" defaultValue={product?.currency ?? "USD"}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={product?.stock ?? 0}
          />
          <FieldHint>0 = no lo controlas.</FieldHint>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="min_order_qty">Pedido mínimo</Label>
          <Input
            id="min_order_qty"
            name="min_order_qty"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={product?.min_order_qty ?? 1}
          />
          <FieldHint>
            Unidades mínimas que debe pedir el cliente.
          </FieldHint>
        </div>
        <div>
          <Label htmlFor="image_url">URL de imagen</Label>
          <Input
            id="image_url"
            name="image_url"
            type="url"
            placeholder="https://…/producto.jpg"
            defaultValue={product?.image_url ?? ""}
          />
          <FieldHint>
            Las fotos aumentan mucho la conversión.
          </FieldHint>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={2000}
          placeholder="Presentación, caja por 24 piezas, origen…"
          defaultValue={product?.description ?? ""}
        />
        <FieldHint>
          Se muestra al abrir el producto en el catálogo.
        </FieldHint>
      </div>

      <label className="flex items-start gap-3 rounded-[var(--radius-theme-sm)] bg-muted p-3 text-sm">
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={product ? product.active : true}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span>
          <span className="font-medium">Visible en el catálogo</span>
          <span className="block text-xs text-muted-foreground">
            Desactívalo para ocultarlo sin borrarlo.
          </span>
        </span>
      </label>

      {state.error && <FieldError>{state.error}</FieldError>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
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
