import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Plus, ExternalLink } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
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
  const recent = orders.slice(0, 6);

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
      description: "Manda el enlace o el QR por WhatsApp a tus clientes.",
      href: published[0] ? `/dashboard/catalogos/${published[0].id}` : "/dashboard/catalogos",
      cta: "Compartir",
      done: orders.length > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow={business.name}
        title={
          pending > 0
            ? `${pending} ${pending === 1 ? "pedido" : "pedidos"} por atender`
            : "Todo al día"
        }
        description={
          pending > 0
            ? "Responde pronto: en mayoreo el primero que contesta se lleva el pedido."
            : "Sin pendientes. Este es el pulso de tu negocio."
        }
        actions={
          <Link
            href="/dashboard/productos"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
          >
            <Plus className="size-4" aria-hidden="true" /> Agregar producto
          </Link>
        }
      />

      <SetupChecklist steps={steps} />

      <StatTiles
        items={[
          {
            label: "Por atender",
            value: String(pending),
            hint: pending > 0 ? "Esperando respuesta" : "Sin pendientes",
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

      {/* Catálogos publicados: lo que el mayorista comparte cada día. */}
      {published.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="t-h2">Tus catálogos públicos</h2>
            <Link href="/dashboard/catalogos" className="t-label link-ink text-primary">
              Gestionar
            </Link>
          </div>

          <ul className="grid-ruled grid sm:grid-cols-2">
            {published.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.display_name || c.name}</p>
                  <p className="t-label mt-1 truncate text-muted-foreground">/c/{c.slug}</p>
                </div>
                <Link
                  href={`/c/${c.slug}`}
                  target="_blank"
                  aria-label={`Abrir catálogo ${c.name} en una pestaña nueva`}
                  className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pedidos recientes, en forma de registro: una línea por pedido. */}
      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="t-h2">Últimos pedidos</h2>
          <Link
            href="/dashboard/pedidos"
            className="t-label link-ink inline-flex items-center gap-1.5 text-primary"
          >
            Ver todos <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="rule-t rule-b py-10 text-center text-sm text-muted-foreground">
            Aún no tienes pedidos. Publica un catálogo y compártelo por WhatsApp.
          </p>
        ) : (
          <ul className="border-y border-border">
            {recent.map((o, i) => (
              <li key={o.id} className={i > 0 ? "rule-t" : undefined}>
                <Link
                  href="/dashboard/pedidos"
                  className="flex items-center gap-4 px-1 py-3 transition-colors hover:bg-muted"
                >
                  <span className="t-num w-16 shrink-0 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {o.customer_name}
                  </span>
                  <Badge tone={statusTone[o.status]} className="hidden sm:inline-flex">
                    {statusLabel[o.status]}
                  </Badge>
                  <span className="t-price w-24 shrink-0 text-right text-sm">
                    {formatMoney(o.total_cents, o.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
