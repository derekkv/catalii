import type { Metadata } from "next";
import { requireBusiness, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingClient } from "./pricing-client";
import { Card, CardContent } from "@/components/ui/card";
import { getPlan } from "@/lib/plans";
import type { PaddleSubscription } from "@/types/database";

export const metadata: Metadata = { title: "Plan y facturación", robots: { index: false } };

export default async function FacturacionPage() {
  const business = await requireBusiness();
  const user = await getUser();
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("paddle_subscription")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = sub as PaddleSubscription | null;
  const plan = getPlan(business.plan);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Plan y facturación</h1>
        <p className="text-muted-foreground">
          Estás en el plan <strong>{plan.name}</strong>. Mejora cuando lo necesites.
        </p>
      </div>

      {subscription?.scheduled_change_at && (
        <Card>
          <CardContent className="p-4 text-sm">
            Tu suscripción tiene un cambio programado para{" "}
            <strong>
              {new Date(subscription.scheduled_change_at).toLocaleDateString("es-MX")}
            </strong>
            .
          </CardContent>
        </Card>
      )}

      <PricingClient email={user?.email ?? undefined} currentTier={business.plan} />

      <p className="text-center text-xs text-muted-foreground">
        Pagos procesados de forma segura por Paddle. El estado del plan se actualiza
        automáticamente vía webhooks.
      </p>
    </div>
  );
}
