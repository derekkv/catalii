"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { useTheme } from "@/components/theme/theme-provider";
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
        theme: theme === "midnight" ? "dark" : "light",
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier, index) => {
          const plan = PLANS[tier];
          const isCurrent = tier === currentTier;
          const isPaid = tier !== "free";
          const isDowngrade = index < currentIndex;
          return (
            <Card
              key={tier}
              className={
                isCurrent
                  ? "border-primary ring-2 ring-primary/30"
                  : plan.highlighted
                    ? "border-primary/60"
                    : undefined
              }
            >
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                    {isCurrent ? (
                      <Badge tone="primary">Tu plan</Badge>
                    ) : (
                      plan.highlighted && (
                        <Badge tone="accent" className="gap-1">
                          <Sparkles className="size-3" aria-hidden="true" /> Popular
                        </Badge>
                      )
                    )}
                  </div>
                  <p className="mt-1">
                    <span className="font-heading text-3xl font-bold">{plan.priceLabel}</span>
                    {isPaid && <span className="text-muted-foreground"> /mes</span>}
                  </p>
                </div>

                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled>
                    Plan activo
                  </Button>
                ) : isPaid ? (
                  <Button
                    onClick={() => checkout(tier, plan.paddlePriceId)}
                    disabled={!paddle || !plan.paddlePriceId || loadingTier === tier}
                    variant={isDowngrade ? "outline" : "primary"}
                    className="gap-2"
                  >
                    {loadingTier === tier && (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    {isDowngrade ? "Cambiar a" : "Mejorar a"} {plan.name}
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Gratis para siempre
                  </Button>
                )}

                {!plan.paddlePriceId && isPaid && (
                  <p className="text-xs text-muted-foreground">
                    Precio no configurado todavía.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
