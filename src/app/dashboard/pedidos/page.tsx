import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OrdersClient, type OrderWithItems } from "./orders-client";
import { StatTiles } from "@/components/dashboard/stat-tiles";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false } };

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

  // Resumen del mes en curso: es la pregunta real ("¿cómo vamos este mes?"),
  // no el acumulado histórico.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const ofMonth = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const billable = ofMonth.filter((o) => o.status !== "cancelled");
  const revenueCents = billable.reduce((s, o) => s + o.total_cents, 0);
  const currency = orders[0]?.currency ?? "USD";
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Pedidos</h1>
        <p className="text-muted-foreground">
          Gestiona y da seguimiento a los pedidos que llegan de tus catálogos.
        </p>
      </div>

      {orders.length > 0 && (
        <StatTiles
          items={[
            { label: "Por atender", value: String(pending), tone: pending > 0 ? "accent" : "muted" },
            { label: "Pedidos del mes", value: String(ofMonth.length) },
            { label: "Valor del mes", value: formatCents(revenueCents, currency) },
          ]}
        />
      )}

      <OrdersClient orders={orders} />
    </div>
  );
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
