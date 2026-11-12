import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { backendEnabled, backendFetch } from "@/lib/backend";
import { OrdersClient, type OrderWithItems } from "./orders-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false } };

async function loadOrders(businessId: string): Promise<OrderWithItems[]> {
  if (backendEnabled()) {
    const res = await backendFetch<OrderWithItems[]>("/api/orders");
    // Se lanza en vez de mostrar una lista vacía: "sin pedidos" sería falso y
    // el límite de error del panel ofrece reintentar.
    if (!res.ok) throw new Error(`No se pudieron cargar los pedidos (${res.status}): ${res.message}`);
    return res.data;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("order")
    .select("*, order_item(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as OrderWithItems[] | null) ?? [];
}

export default async function PedidosPage() {
  const business = await requireBusiness();
  const orders = await loadOrders(business.id);

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
  const avgCents = billable.length > 0 ? Math.round(revenueCents / billable.length) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        eyebrow="Operación"
        title="Pedidos"
        description="Los pedidos que llegan de tus catálogos, con su estado y seguimiento."
      />

      {orders.length > 0 && (
        <StatTiles
          items={[
            {
              label: "Por atender",
              value: String(pending),
              tone: pending > 0 ? "accent" : "muted",
            },
            { label: "Pedidos del mes", value: String(ofMonth.length) },
            { label: "Valor del mes", value: formatMoney(revenueCents, currency) },
            { label: "Ticket promedio", value: formatMoney(avgCents, currency) },
          ]}
        />
      )}

      <OrdersClient orders={orders} />
    </div>
  );
}
