"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { useTheme } from "@/components/theme/theme-provider";
import { getThemeMeta } from "@/lib/themes";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/types/database";

export function PricingClient({
  email,
  currentTier,
}: {
  email?: string;
  currentTier: PlanTier;
}) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const { theme } = useTheme();

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production" | undefined;

  useEffect(() => {
    if (!token || !env) return;
    initializePaddle({ token, environment: env }).then((p) => p && setPaddle(p));
  }, [token, env]);

  function checkout(tier: PlanTier, priceId?: string) {
    if (!paddle || !priceId) return;
    setLoadingTier(tier);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(email ? { customer: { email } } : {}),
      settings: {
        variant: "one-page",
        // El modo se consulta al registro de themes; antes se comparaba con el
        // id "midnight", que al renombrar los themes dejó el checkout en claro
        // sobre una app oscura.
        theme: getThemeMeta(theme).mode === "dark" ? "dark" : "light",
        successUrl: `${window.location.origin}/dashboard/facturacion?success=1`,
      },
    });
    // El evento real de éxito lo maneja el webhook (fuente de verdad).
    setTimeout(() => setLoadingTier(null), 1500);
  }

  const paddleConfigured = Boolean(token && env);
  const currentIndex = PLAN_ORDER.indexOf(currentTier);

  return (
    <div className="space-y-4">
      {!paddleConfigured && (
        // Tokens del theme en lugar de `amber-*` fijos: en los themes oscuros
        // la caja clara quedaba ilegible y fuera de paleta.
        <div className="rounded-[var(--radius-theme-sm)] border border-warning bg-warning/10 p-3 text-sm text-foreground">
          Paddle no está configurado. Define <code>NEXT_PUBLIC_PADDLE_CLIENT_TOKEN</code> y{" "}
          <code>NEXT_PUBLIC_PADDLE_ENV</code> para habilitar los pagos.
        </div>
      )}

      <div className="grid-ruled grid md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier, index) => {
          const plan = PLANS[tier];
          const isCurrent = tier === currentTier;
          const isPaid = tier !== "free";
          const isDowngrade = index < currentIndex;
          return (
            <div
              key={tier}
              className={cn("flex flex-col p-5", isCurrent && "bg-muted")}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="t-h3">{plan.name}</h3>
                {isCurrent ? (
                  <Badge tone="primary">Tu plan</Badge>
                ) : (
                  plan.highlighted && (
                    <Badge tone="accent" className="gap-1.5">
                      <Sparkles className="size-3" aria-hidden="true" /> Popular
                    </Badge>
                  )
                )}
              </div>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="t-price text-3xl">{plan.priceLabel}</span>
                {isPaid && <span className="t-label text-muted-foreground">/mes</span>}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[0.8125rem]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" disabled className="mt-6">
                  Plan activo
                </Button>
              ) : isPaid ? (
                <Button
                  onClick={() => checkout(tier, plan.paddlePriceId)}
                  disabled={!paddle || !plan.paddlePriceId || loadingTier === tier}
                  variant={isDowngrade ? "outline" : "primary"}
                  className="mt-6 gap-2"
                >
                  {loadingTier === tier && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  {isDowngrade ? "Cambiar a" : "Mejorar a"} {plan.name}
                </Button>
              ) : (
                <Button variant="outline" disabled className="mt-6">
                  Gratis para siempre
                </Button>
              )}

              {!plan.paddlePriceId && isPaid && (
                <p className="t-small mt-2 text-muted-foreground">
                  Precio no configurado todavía.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
