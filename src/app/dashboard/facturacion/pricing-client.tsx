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

  return (
    <div className="space-y-4">
      {!paddleConfigured && (
        <div className="rounded-[var(--radius-theme-sm)] border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          Paddle no está configurado. Define <code>NEXT_PUBLIC_PADDLE_CLIENT_TOKEN</code> y{" "}
          <code>NEXT_PUBLIC_PADDLE_ENV</code> para habilitar los pagos.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const isCurrent = tier === currentTier;
          const isPaid = tier !== "free";
          return (
            <Card
              key={tier}
              className={
                plan.highlighted ? "border-primary ring-2 ring-primary/30" : undefined
              }
            >
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                    {plan.highlighted && (
                      <Badge tone="primary" className="gap-1">
                        <Sparkles className="size-3" aria-hidden="true" /> Popular
                      </Badge>
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
                  <Badge tone="success" className="justify-center py-2">
                    Tu plan actual
                  </Badge>
                ) : isPaid ? (
                  <Button
                    onClick={() => checkout(tier, plan.paddlePriceId)}
                    disabled={!paddle || !plan.paddlePriceId || loadingTier === tier}
                    variant={plan.highlighted ? "primary" : "outline"}
                  >
                    {loadingTier === tier ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Elegir {plan.name}
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Gratis para siempre
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
