import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Plus, ExternalLink } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { formatMoney } from "@/lib/utils";
import type { Catalog, Order } from "@/types/database";

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

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ count: productCount }, catalogsRes, ordersRes] = await Promise.all([
    supabase
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("catalog")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    // Se traen los pedidos del mes para calcular métricas reales (valor,
    // pendientes) en lugar de sólo un contador histórico.
    supabase
      .from("order")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const catalogs = (catalogsRes.data as Catalog[] | null) ?? [];
  const orders = (ordersRes.data as Order[] | null) ?? [];
  const published = catalogs.filter((c) => c.is_public);

  const ofMonth = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const billable = ofMonth.filter((o) => o.status !== "cancelled");
  const revenueCents = billable.reduce((s, o) => s + o.total_cents, 0);
  const currency = orders[0]?.currency ?? "USD";
  const pending = orders.filter((o) => o.status === "pending").length;
  const recent = orders.slice(0, 5);

  const steps = [
    {
      title: "Agrega tus productos",
      description: "Cárgalos a mano o importa tu lista de precios en CSV.",
      href: "/dashboard/productos",
      cta: "Agregar",
      done: (productCount ?? 0) > 0,
    },
    {
      title: "Crea un catálogo",
      description: "Elige qué productos incluir y con qué apariencia.",
      href: "/dashboard/catalogos",
      cta: "Crear",
      done: catalogs.length > 0,
    },
    {
      title: "Publícalo",
      description: "Hasta que lo publiques, el enlace no funciona para tus clientes.",
      href: catalogs[0] ? `/dashboard/catalogos/${catalogs[0].id}` : "/dashboard/catalogos",
      cta: "Publicar",
      done: published.length > 0,
    },
    {
      title: "Compártelo y recibe tu primer pedido",
      description: "Envía el enlace o el QR por WhatsApp a tus clientes.",
      href: published[0] ? `/dashboard/catalogos/${published[0].id}` : "/dashboard/catalogos",
      cta: "Compartir",
      done: orders.length > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">
            Hola, {business.name} 👋
          </h1>
          <p className="text-muted-foreground">
            {pending > 0
              ? `Tienes ${pending} ${pending === 1 ? "pedido" : "pedidos"} por atender.`
              : "Todo al día. Este es el pulso de tu negocio."}
          </p>
        </div>
        <Link
          href="/dashboard/productos"
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-semibold text-on-primary shadow-soft transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" /> Agregar producto
        </Link>
      </div>

      <SetupChecklist steps={steps} />

      <StatTiles
        items={[
          {
            label: "Por atender",
            value: String(pending),
            hint: pending > 0 ? "Responde pronto" : "Sin pendientes",
            href: "/dashboard/pedidos",
            tone: pending > 0 ? "accent" : undefined,
          },
          {
            label: "Pedidos del mes",
            value: String(ofMonth.length),
            hint: `${orders.length} en total`,
            href: "/dashboard/pedidos",
          },
          {
            label: "Valor del mes",
            value: formatMoney(revenueCents, currency),
            hint: "Excluye cancelados",
            href: "/dashboard/pedidos",
          },
          {
            label: "Productos",
            value: String(productCount ?? 0),
            hint: `${published.length} ${published.length === 1 ? "catálogo" : "catálogos"} publicado${
              published.length === 1 ? "" : "s"
            }`,
            href: "/dashboard/productos",
          },
        ]}
      />

      {/* Catálogos publicados a mano: lo que el mayorista comparte todos los días. */}
      {published.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Tus catálogos públicos</h2>
            <Link
              href="/dashboard/catalogos"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Gestionar <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {published.slice(0, 4).map((c) => (
              <li key={c.id}>
                <Card className="h-full">
                  <CardContent className="flex h-full items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.display_name || c.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        /c/{c.slug}
                      </p>
                    </div>
                    <Link
                      href={`/c/${c.slug}`}
                      target="_blank"
                      aria-label={`Abrir catálogo ${c.name} en una pestaña nueva`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-theme-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pedidos recientes */}
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

        {recent.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aún no tienes pedidos. Publica un catálogo y compártelo por WhatsApp.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href="/dashboard/pedidos"
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{o.customer_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        #{o.id.slice(0, 8)} ·{" "}
                        {new Date(o.created_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">
                        {formatMoney(o.total_cents, o.currency)}
                      </span>
                      <Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
