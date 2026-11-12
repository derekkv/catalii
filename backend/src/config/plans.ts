import type { PlanTier } from "@/types/database.js";

/** Límites por plan (gating). Alineado con src/lib/plans.ts del front. */
const INF = Number.POSITIVE_INFINITY;

export interface PlanLimits {
  maxProducts: number;
  maxCatalogs: number;
  /**
   * Infinity = ilimitado.
   *
   * OJO: no se comprueba en este backend. Lo aplica el RPC `place_order`
   * (`supabase/migrations/0007_order_limits_and_indexes.sql`), que es el camino
   * común del front y del backend. Mismo dato en tres sitios hasta la #27:
   * este archivo, `src/lib/plans.ts` y la función SQL
   * `plan_max_orders_per_month(plan_tier)` (null = ilimitado).
   * Si cambias uno, cambia los tres.
   */
  maxOrdersPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { maxProducts: 50, maxCatalogs: 1, maxOrdersPerMonth: 20 },
  starter: { maxProducts: 500, maxCatalogs: 3, maxOrdersPerMonth: INF },
  pro: { maxProducts: 5000, maxCatalogs: INF, maxOrdersPerMonth: INF },
  business: { maxProducts: INF, maxCatalogs: INF, maxOrdersPerMonth: INF },
};

export function limitsFor(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;
}
