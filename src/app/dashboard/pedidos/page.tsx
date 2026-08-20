import type { Metadata } from "next";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { OrderStatusSelect } from "./order-status-select";
import type { Order, OrderItem } from "@/types/database";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false } };

type OrderWithItems = Order & { order_item: OrderItem[] };

export default async function PedidosPage() {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data } = await supabase
    .from("order")
    .select("*, order_item(*)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = (data as OrderWithItems[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Pedidos</h1>
        <p className="text-muted-foreground">Gestiona y da seguimiento a los pedidos recibidos.</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <ShoppingCart className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Todavía no recibes pedidos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const waLink = `https://wa.me/${o.customer_whatsapp.replace(/[^0-9]/g, "")}`;
            return (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading font-bold">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{o.id.slice(0, 8)} ·{" "}
                        {new Date(o.created_at).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" /> {o.customer_whatsapp}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-lg font-bold">
                        {formatMoney(o.total_cents, o.currency)}
                      </span>
                      <OrderStatusSelect id={o.id} status={o.status} />
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                    {o.order_item.map((it) => (
                      <li key={it.id} className="flex justify-between gap-2 text-muted-foreground">
                        <span className="truncate">
                          {it.quantity}× {it.product_name}
                        </span>
                        <span className="shrink-0">{formatMoney(it.subtotal_cents, o.currency)}</span>
                      </li>
                    ))}
                  </ul>

                  {o.notes && (
                    <p className="mt-2 rounded-[var(--radius-theme-sm)] bg-muted p-2 text-sm">
                      📝 {o.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
