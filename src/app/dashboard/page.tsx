import Link from "next/link";
import type { Metadata } from "next";
import { Package, ShoppingCart, BookOpen, Clock, ArrowRight, Plus } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import type { Order } from "@/types/database";

export const metadata: Metadata = { title: "Resumen", robots: { index: false } };

const statusTone = {
  pending: "warning",
  confirmed: "primary",
  shipped: "success",
  cancelled: "danger",
} as const;

const statusLabel = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  cancelled: "Cancelado",
} as const;

export default async function DashboardPage() {
  const business = await requireBusiness();
  const supabase = await createClient();

  const [{ count: productCount }, { count: catalogCount }, { count: orderCount }, recent] =
    await Promise.all([
      supabase.from("product").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      supabase.from("catalog").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      supabase.from("order").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      supabase
        .from("order")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const orders = (recent.data as Order[] | null) ?? [];
  const pending = orders.filter((o) => o.status === "pending").length;

  const stats = [
    { label: "Productos", value: productCount ?? 0, icon: Package, href: "/dashboard/productos" },
    { label: "Catálogos", value: catalogCount ?? 0, icon: BookOpen, href: "/dashboard/catalogos" },
    { label: "Pedidos", value: orderCount ?? 0, icon: ShoppingCart, href: "/dashboard/pedidos" },
    { label: "Pendientes", value: pending, icon: Clock, href: "/dashboard/pedidos" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Hola, {business.name} 👋</h1>
          <p className="text-muted-foreground">Este es el pulso de tu negocio hoy.</p>
        </div>
        <Link
          href="/dashboard/productos"
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-semibold text-on-primary shadow-soft transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" /> Agregar producto
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-soft">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="text-2xl font-bold leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Pedidos recientes</h2>
          <Link
            href="/dashboard/pedidos"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aún no tienes pedidos. Publica un catálogo y compártelo por WhatsApp.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.customer_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatMoney(o.total_cents, o.currency)}</span>
                    <Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
