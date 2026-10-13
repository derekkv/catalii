import type { PlanTier } from "@/types/database.js";

/** Límites por plan (gating). Alineado con src/lib/plans.ts del front. */
const INF = Number.POSITIVE_INFINITY;

export interface PlanLimits {
  maxProducts: number;
  maxCatalogs: number;
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
