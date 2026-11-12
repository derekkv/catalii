import type { PlanTier } from "@/types/database";

/**
 * Definición de planes y límites (gating). Los IDs de precio de Paddle se
 * cargan desde variables de entorno para poder cambiarlos sin redeploy y para
 * no acoplar sandbox/producción en el código.
 */
export interface PlanDef {
  tier: PlanTier;
  name: string;
  priceLabel: string;
  paddlePriceId?: string; // pri_... (solo planes de pago)
  limits: {
    maxProducts: number;
    maxCatalogs: number;
    /**
     * Infinity = ilimitado.
     *
     * OJO: este límite NO se aplica aquí. Se comprueba dentro del RPC
     * `place_order` (`supabase/migrations/0007_order_limits_and_indexes.sql`),
     * porque es el único camino común al front y al backend y el pedido lo
     * envía un comprador anónimo. El valor vive por triplicado hasta que se
     * cierre la #27 (desduplicar lógica):
     *   · este archivo
     *   · backend/src/config/plans.ts  -> PLAN_LIMITS[tier].maxOrdersPerMonth
     *   · función SQL plan_max_orders_per_month(plan_tier)  (null = ilimitado)
     * Si cambias uno, cambia los tres.
     */
    maxOrdersPerMonth: number;
  };
  features: string[];
  highlighted?: boolean;
}

const INF = Number.POSITIVE_INFINITY;

export const PLANS: Record<PlanTier, PlanDef> = {
  free: {
    tier: "free",
    name: "Gratis",
    priceLabel: "$0",
    limits: { maxProducts: 50, maxCatalogs: 1, maxOrdersPerMonth: 20 },
    features: ["1 catálogo", "50 productos", "Landing page", "20 pedidos/mes"],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    priceLabel: "$19",
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER,
    limits: { maxProducts: 500, maxCatalogs: 3, maxOrdersPerMonth: INF },
    features: ["3 catálogos", "500 productos", "Personalización", "Pedidos ilimitados"],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceLabel: "$49",
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO,
    limits: { maxProducts: 5000, maxCatalogs: INF, maxOrdersPerMonth: INF },
    features: ["Catálogos ilimitados", "5,000 productos", "Personalización", "Pedidos ilimitados"],
    highlighted: true,
  },
  business: {
    tier: "business",
    name: "Business",
    priceLabel: "$99",
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS,
    limits: { maxProducts: INF, maxCatalogs: INF, maxOrdersPerMonth: INF },
    features: ["Catálogos ilimitados", "Productos ilimitados", "Personalización", "Pedidos ilimitados"],
  },
};

/** Moneda en la que se muestran los precios de los planes de pago. */
export const PLAN_CURRENCY = "USD";

export const PLAN_ORDER: PlanTier[] = ["free", "starter", "pro", "business"];

/** Mapea un product_id de Paddle al tier del plan (para el subscription-sync). */
export function planFromPaddleProduct(productId: string | null | undefined): PlanTier | null {
  if (!productId) return null;
  const map: Record<string, PlanTier> = {
    [process.env.PADDLE_PRODUCT_STARTER ?? ""]: "starter",
    [process.env.PADDLE_PRODUCT_PRO ?? ""]: "pro",
    [process.env.PADDLE_PRODUCT_BUSINESS ?? ""]: "business",
  };
  return map[productId] ?? null;
}

export function getPlan(tier: PlanTier): PlanDef {
  return PLANS[tier] ?? PLANS.free;
}
