import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { requireBusiness, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingClient } from "./pricing-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { getPlan } from "@/lib/plans";
import { getLiveSubscription, getNextBilledAt } from "@/lib/paddle/subscription";
import { CancelSubscriptionButton } from "./cancel-subscription-button";

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

  const [subscription, productCount, catalogCount] = await Promise.all([
    getLiveSubscription(business.id),
    supabase
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("catalog")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ]);

  // La BD no guarda la fecha del próximo cobro: se consulta a Paddle y, si
  // falla, simplemente no se muestra.
  const nextBilledAt = subscription ? await getNextBilledAt(subscription.subscription_id) : null;
  const plan = getPlan(business.plan);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        eyebrow={`Plan ${plan.name}`}
        title="Plan y facturación"
        description="Mejora cuando lo necesites. Los límites se aplican al instante."
      />

      {/* Vuelta del checkout de Paddle: el plan lo activa el webhook, así que
          se avisa de forma explícita en vez de dejar al usuario mirando el
          plan antiguo y pensando que el pago falló. */}
      {success && (
        <p className="flex items-start gap-3 border-l-2 border-primary bg-muted px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="font-medium">Pago recibido.</span> Estamos activando tu plan;
            puede tardar unos segundos. Recarga la página si aún ves el anterior.
          </span>
        </p>
      )}

      {subscription?.scheduled_change_at && (
        <p className="flex items-start gap-3 border-l-2 border-input bg-muted px-4 py-3 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            {/* La BD solo guarda la fecha del cambio programado, no su tipo; en
                esta app el único que se puede programar es la cancelación. */}
            <span className="font-medium">Cancelación programada.</span> Tu suscripción
            tiene un cambio programado para{" "}
            <span className="t-num">
              {new Date(subscription.scheduled_change_at).toLocaleDateString("es-EC", {
                dateStyle: "long",
              })}
            </span>
            ; hasta entonces conservas tu plan.
          </span>
        </p>
      )}

      {/* Consumo actual: argumenta la mejora de plan con datos del negocio. */}
      <section>
        <h2 className="t-h2 mb-4">Tu consumo</h2>
        <div className="flex flex-wrap gap-x-12 gap-y-6 border-y border-border py-5">
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

      <section>
        <h2 className="t-h2 mb-4">Planes</h2>
        <PricingClient
          email={user?.email ?? undefined}
          currentTier={business.plan}
          hasLiveSubscription={Boolean(subscription)}
          hasScheduledChange={Boolean(subscription?.scheduled_change_at)}
          nextBilledAt={nextBilledAt}
        />
      </section>

      {subscription && !subscription.scheduled_change_at && (
        <section className="rule-t pt-5">
          <h2 className="t-h2 mb-2">Suscripción</h2>
          <p className="t-small mb-4 text-muted-foreground">
            Puedes cancelar cuando quieras desde aquí, con el mismo medio con el que contrataste.
            Conservas tu plan hasta el final del periodo ya pagado.
          </p>
          <CancelSubscriptionButton nextBilledAt={nextBilledAt} />
        </section>
      )}

      <p className="t-small rule-t pt-5 text-muted-foreground">
        Pagos procesados por Paddle. El estado del plan se actualiza automáticamente vía
        webhooks firmados.
      </p>
    </div>
  );
}
