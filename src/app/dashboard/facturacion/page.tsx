import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { requireBusiness, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingClient } from "./pricing-client";
import { Card, CardContent } from "@/components/ui/card";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { getPlan } from "@/lib/plans";
import type { PaddleSubscription } from "@/types/database";

export const metadata: Metadata = { title: "Plan y facturación", robots: { index: false } };

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const business = await requireBusiness();
  const user = await getUser();
  const supabase = await createClient();

  const [subRes, productCount, catalogCount] = await Promise.all([
    supabase
      .from("paddle_subscription")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("catalog")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ]);

  const subscription = subRes.data as PaddleSubscription | null;
  const plan = getPlan(business.plan);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Plan y facturación</h1>
        <p className="text-muted-foreground">
          Estás en el plan <strong>{plan.name}</strong>. Mejora cuando lo necesites.
        </p>
      </div>

      {/* Vuelta del checkout de Paddle: el plan lo aplica el webhook, así que se
          avisa de forma explícita en vez de dejar al usuario mirando el plan
          antiguo y pensando que el pago falló. */}
      {success && (
        <Card className="border-primary">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              <span className="font-semibold">¡Pago recibido!</span> Estamos activando tu plan.
              Puede tardar unos segundos; recarga la página si aún ves el plan anterior.
            </p>
          </CardContent>
        </Card>
      )}

      {subscription?.scheduled_change_at && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p>
              Tu suscripción tiene un cambio programado para{" "}
              <strong>
                {new Date(subscription.scheduled_change_at).toLocaleDateString("es-MX", {
                  dateStyle: "long",
                })}
              </strong>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Consumo actual: argumenta el upgrade con datos propios del negocio. */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-bold">Tu consumo</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageMeter
            label="Productos"
            used={productCount.count ?? 0}
            limit={plan.limits.maxProducts}
          />
          <UsageMeter
            label="Catálogos"
            used={catalogCount.count ?? 0}
            limit={plan.limits.maxCatalogs}
          />
        </div>
      </section>

      <PricingClient email={user?.email ?? undefined} currentTier={business.plan} />

      <p className="text-center text-xs text-muted-foreground">
        Pagos procesados de forma segura por Paddle. El estado del plan se actualiza
        automáticamente vía webhooks.
      </p>
    </div>
  );
}
