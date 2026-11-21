import "server-only";
import type { PostgrestError, User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server-internal";
import type {
  Business,
  Catalog,
  MetricKind,
  Order,
  OrderStatus,
  PaddleSubscription,
  PlanTier,
  Product,
} from "@/types/database";

/**
 * Consultas del panel de administración (/admin).
 *
 * ⚠ TODO lo de este archivo consulta con el cliente de SERVICE ROLE, que salta
 * RLS. Es `server-only` y **asume que quien llama ya pasó por
 * `requireAdmin()`**: no hay ninguna otra comprobación de permisos aquí
 * dentro. Cada página de /admin llama a `requireAdmin()` como primera
 * instrucción; si añades una página nueva, hazlo también.
 *
 * Nada de lo que devuelven estas funciones contiene secretos: solo filas de
 * negocio, suscripción, pedido y métricas. Los identificadores de Paddle
 * (`sub_…`, `ctm_…`, `pri_…`) son referencias, no credenciales.
 *
 * ── Cómo se evita el N+1 ───────────────────────────────────────────────────
 * Ninguna función consulta "por negocio". Se hace una lectura por TABLA y los
 * desgloses se agrupan en memoria con `Map`. PostgREST no sabe agrupar, así
 * que las únicas alternativas serían una consulta por negocio (N+1) o una
 * vista SQL con `group by`. Se eligió agrupar en memoria porque el volumen hoy
 * es pequeño, las filas que se traen son estrechas (`business_id` y poco más)
 * y así el panel no depende de una migración más por aplicar.
 *
 * Los TOTALES de plataforma sí se piden al servidor con `count: "exact"` y
 * `head: true` (una consulta, cero filas transferidas), así que son exactos
 * aunque la lectura de filas se quede corta. Cuando una lectura topa con
 * `ROW_LIMIT` se añade un aviso a `notes` y la interfaz lo muestra: un número
 * parcial presentado como total es peor que no mostrarlo.
 *
 * Si algún día esto se queda corto, el siguiente paso es una vista
 * `admin_business_stats` con `group by business_id` concedida solo a
 * `service_role` y leerla en `loadBusinessList()`.
 */

// ───────────────────────────────────────────────────────────────────────────
// Límites y tipos
// ───────────────────────────────────────────────────────────────────────────

/**
 * Tope de filas por lectura de agregación.
 *
 * Protege la memoria del Worker: por encima de esto se devuelve lo leído y se
 * avisa de que el desglose es parcial, en vez de intentar traer la tabla
 * entera.
 */
const ROW_LIMIT = 20000;

/** Días de la serie temporal de métricas. */
export const METRIC_DAYS = 30;

/** Cuentas de Auth que se recorren como máximo al resolver correos de dueño. */
const AUTH_PAGE_SIZE = 200;
const AUTH_MAX_PAGES = 10;

/**
 * Fila de `business` leída con `select("*")`.
 *
 * Las columnas de la migración 0009 (`is_public`, `show_products`, perfil
 * público) pueden no existir todavía en la base: esta migración no se ha
 * ejecutado. Con `select("*")` la consulta no falla y esas claves llegan como
 * `undefined`, que la interfaz muestra como «desconocido» en vez de inventar
 * un `false`.
 */
export type AdminBusiness = Pick<
  Business,
  "id" | "owner_id" | "name" | "slug" | "plan" | "email" | "created_at" | "updated_at" | "theme"
> &
  Partial<Business>;

/** Importes agrupados por moneda: sumar USD con COP daría una cifra falsa. */
export type MoneyByCurrency = Record<string, number>;

/** Cuenta de Auth del dueño de un negocio. */
export interface OwnerAccount {
  id: string;
  email: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
}

/** Un negocio con sus cifras agregadas, para el listado. */
export interface BusinessStats {
  business: AdminBusiness;
  /** Correo de la cuenta con la que entra el dueño (Supabase Auth). */
  ownerEmail: string | null;
  lastSignInAt: string | null;
  catalogs: number;
  publishedCatalogs: number;
  products: number;
  orders: number;
  pendingOrders: number;
  /** Valor de los pedidos no cancelados, por moneda. */
  orderValue: MoneyByCurrency;
  /** `business_view` + `catalog_view`, histórico. */
  views: number;
  whatsappClicks: number;
  subscription: PaddleSubscription | null;
}

/** Suscripción de Paddle con el negocio al que apunta. */
export interface SubscriptionRow {
  subscription: PaddleSubscription;
  business: AdminBusiness | null;
  /** Correo con el que Paddle tiene registrado al cliente. */
  customerEmail: string | null;
}

/** Pedido con el negocio que lo recibió. */
export interface OrderRow {
  order: Order;
  business: AdminBusiness | null;
}

/** Un día de la serie de métricas. Todas las fechas son UTC. */
export interface MetricDay {
  day: string;
  businessViews: number;
  catalogViews: number;
  whatsappClicks: number;
  ordersSent: number;
  /** `businessViews + catalogViews`. */
  views: number;
}

export interface MetricsSummary {
  /** `false` si `page_metric` todavía no existe (migración 0009 sin aplicar). */
  available: boolean;
  byKind: Record<MetricKind, number>;
  /** Serie completa de `METRIC_DAYS` días, con los días sin datos a cero. */
  daily: MetricDay[];
  /** Primer y último día (UTC) de la serie. */
  from: string;
  to: string;
}

export interface AdminOverview {
  businesses: { total: number; last7: number; last30: number };
  /** Reparto por la columna `business.plan`. */
  plans: Record<PlanTier, number>;
  /** Negocios con plan distinto de `free`. */
  paidBusinesses: number;
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
    paused: number;
    canceled: number;
    other: number;
    /** Suscripciones con un cambio ya programado (fecha incluida). */
    scheduled: SubscriptionRow[];
  };
  /**
   * Negocios cuyo plan no cuadra con su suscripción de Paddle. Es el aviso
   * operativo más útil: o alguien paga y no tiene el plan, o tiene el plan y
   * no paga.
   */
  mismatches: { business: AdminBusiness; subscriptionStatus: string | null }[];
  catalogs: { total: number; published: number };
  products: { total: number; active: number };
  orders: {
    total: number;
    month: number;
    pending: number;
    /** Valor de los pedidos no cancelados del mes en curso (UTC), por moneda. */
    monthValue: MoneyByCurrency;
    /** Valor de los pedidos no cancelados leídos (ver `notes`), por moneda. */
    readValue: MoneyByCurrency;
  };
  metrics: MetricsSummary;
  /** Inicio del mes en curso, en UTC (ISO). */
  monthStart: string;
  notes: string[];
}

export interface BusinessDetail {
  business: AdminBusiness;
  owner: OwnerAccount | null;
  catalogs: Catalog[];
  products: { total: number; active: number; recent: Product[] };
  orders: {
    total: number;
    pending: number;
    value: MoneyByCurrency;
    recent: Order[];
  };
  subscriptions: SubscriptionRow[];
  metrics: MetricsSummary;
  notes: string[];
}

// ───────────────────────────────────────────────────────────────────────────
// Utilidades
// ───────────────────────────────────────────────────────────────────────────

/** Fecha en UTC con formato `YYYY-MM-DD`, igual que `page_metric.day`. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Los últimos `n` días UTC, del más antiguo al más reciente. */
function lastUtcDays(n: number): string[] {
  const today = new Date();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    days.push(utcDay(d));
  }
  return days;
}

/** Inicio del día UTC de hace `n` días, en ISO (para comparar `created_at`). */
function utcDaysAgo(n: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

/** Primer instante del mes en curso, en UTC. */
function utcMonthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Traduce un error de PostgREST a un aviso que el administrador pueda accionar. */
function describeError(label: string, error: PostgrestError): string {
  // 42P01 = relación inexistente; PGRST205 = no está en la caché de esquema.
  const missing =
    error.code === "42P01" || error.code === "PGRST205" || /schema cache/i.test(error.message);
  if (missing) {
    return `${label}: la tabla todavía no existe en la base de datos. Aplica supabase/migrations/0009_business_pages_and_metrics.sql.`;
  }
  // 42703 = columna inexistente (p. ej. `is_public` antes de la 0009).
  if (error.code === "42703") {
    return `${label}: falta una columna. Aplica las migraciones pendientes (0009).`;
  }
  // Un fallo de red llega sin `code` (cadena vacía), así que no se imprime.
  const code = error.code ? ` [${error.code}]` : "";
  return `${label}: no se pudo leer${code}. ${error.message}`;
}

/** Extrae las filas de una respuesta, anotando errores y lecturas parciales. */
function take<T>(
  res: { data: T[] | null; error: PostgrestError | null },
  label: string,
  notes: string[],
): T[] {
  if (res.error) {
    notes.push(describeError(label, res.error));
    return [];
  }
  const rows = res.data ?? [];
  if (rows.length >= ROW_LIMIT) {
    notes.push(
      `${label}: se leyeron las primeras ${ROW_LIMIT.toLocaleString("es-EC")} filas, así que los desgloses por negocio son parciales (los totales de arriba siguen siendo exactos).`,
    );
  }
  return rows;
}

/** Extrae un `count` exacto, anotando el error si lo hubo. */
function takeCount(
  res: { count: number | null; error: PostgrestError | null },
  label: string,
  notes: string[],
): number {
  if (res.error) {
    notes.push(describeError(label, res.error));
    return 0;
  }
  return res.count ?? 0;
}

/** Suma importes por moneda, excluyendo cancelados. */
function sumByCurrency(
  rows: { total_cents: number; currency: string; status: OrderStatus }[],
): MoneyByCurrency {
  const out: MoneyByCurrency = {};
  for (const row of rows) {
    if (row.status === "cancelled") continue;
    const key = row.currency || "USD";
    out[key] = (out[key] ?? 0) + row.total_cents;
  }
  return out;
}

/** Suscripción que se considera viva a efectos de facturación. */
function isLiveStatus(status: string): boolean {
  return status === "active" || status === "trialing" || status === "past_due" || status === "paused";
}

const EMPTY_KIND_TOTALS: Record<MetricKind, number> = {
  business_view: 0,
  catalog_view: 0,
  whatsapp_click: 0,
  order_sent: 0,
};

/** Serie vacía, para cuando `page_metric` no existe o no hay datos. */
function emptyMetrics(available: boolean): MetricsSummary {
  const days = lastUtcDays(METRIC_DAYS);
  return {
    available,
    byKind: { ...EMPTY_KIND_TOTALS },
    daily: days.map((day) => ({
      day,
      businessViews: 0,
      catalogViews: 0,
      whatsappClicks: 0,
      ordersSent: 0,
      views: 0,
    })),
    from: days[0],
    to: days[days.length - 1],
  };
}

interface MetricRow {
  business_id: string;
  kind: MetricKind;
  day: string;
  count: number;
}

/** Agrupa filas de `page_metric` en totales por tipo y serie por día. */
function buildMetrics(rows: MetricRow[]): MetricsSummary {
  const summary = emptyMetrics(true);
  const index = new Map(summary.daily.map((d) => [d.day, d]));

  for (const row of rows) {
    const count = row.count ?? 0;
    summary.byKind[row.kind] = (summary.byKind[row.kind] ?? 0) + count;

    const day = index.get(row.day);
    if (!day) continue; // fuera de la ventana de METRIC_DAYS
    if (row.kind === "business_view") day.businessViews += count;
    else if (row.kind === "catalog_view") day.catalogViews += count;
    else if (row.kind === "whatsapp_click") day.whatsappClicks += count;
    else if (row.kind === "order_sent") day.ordersSent += count;
    day.views = day.businessViews + day.catalogViews;
  }

  return summary;
}

/**
 * Correos de las cuentas de Auth, por `owner_id`.
 *
 * `business.email` es el correo de CONTACTO que el dueño escribió en el
 * onboarding y puede cambiarlo; para soporte hace falta el correo de la cuenta
 * con la que entra, que vive en `auth.users` y solo se lee con la API de
 * administración. No se expone ningún otro dato de la cuenta.
 */
async function loadOwnerAccounts(notes: string[]): Promise<Map<string, OwnerAccount>> {
  const db = createServiceClient();
  const map = new Map<string, OwnerAccount>();

  for (let page = 1; page <= AUTH_MAX_PAGES; page++) {
    /*
     * `listUsers()` devuelve `{ error }` ante un fallo de transporte en vez de
     * lanzar, pero el try/catch cubre el caso de que lance (aborto del
     * runtime, respuesta no JSON): el correo del dueño es un adorno útil, no
     * un motivo para tumbar la página entera.
     */
    try {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
      if (error) {
        notes.push(
          `No se pudieron leer las cuentas de Supabase Auth (${error.message}). En «dueño» se muestra el correo de contacto del negocio, que puede ser otro.`,
        );
        break;
      }
      const users: User[] = data?.users ?? [];
      for (const user of users) {
        map.set(user.id, {
          id: user.id,
          email: user.email ?? null,
          lastSignInAt: user.last_sign_in_at ?? null,
          createdAt: user.created_at ?? null,
        });
      }
      if (users.length < AUTH_PAGE_SIZE) break;
      if (page === AUTH_MAX_PAGES) {
        notes.push(
          `Hay más de ${(AUTH_PAGE_SIZE * AUTH_MAX_PAGES).toLocaleString("es-EC")} cuentas en Auth: algunos correos de dueño pueden salir vacíos.`,
        );
      }
    } catch (error) {
      notes.push(
        `No se pudieron leer las cuentas de Supabase Auth (${error instanceof Error ? error.message : "error desconocido"}). En «dueño» se muestra el correo de contacto del negocio.`,
      );
      break;
    }
  }

  return map;
}

// ───────────────────────────────────────────────────────────────────────────
// Resumen general
// ───────────────────────────────────────────────────────────────────────────

/** Cifras de la portada del panel. Una consulta por tabla, nunca por negocio. */
export async function loadOverview(): Promise<AdminOverview> {
  const db = createServiceClient();
  const notes: string[] = [];

  const monthStart = utcMonthStart();
  const since7 = utcDaysAgo(7);
  const since30 = utcDaysAgo(30);
  const metricsFrom = lastUtcDays(METRIC_DAYS)[0];

  const [
    businessesRes,
    catalogTotalRes,
    catalogPublishedRes,
    productTotalRes,
    productActiveRes,
    orderTotalRes,
    orderMonthRes,
    orderPendingRes,
    orderRowsRes,
    subscriptionsRes,
    metricsRes,
  ] = await Promise.all([
    db
      .from("business")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    db.from("catalog").select("id", { count: "exact", head: true }),
    db.from("catalog").select("id", { count: "exact", head: true }).eq("is_public", true),
    db.from("product").select("id", { count: "exact", head: true }),
    db.from("product").select("id", { count: "exact", head: true }).eq("active", true),
    db.from("order").select("id", { count: "exact", head: true }),
    db.from("order").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    db.from("order").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db
      .from("order")
      .select("business_id, status, total_cents, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    db.from("paddle_subscription").select("*", { count: "exact" }).limit(ROW_LIMIT),
    db
      .from("page_metric")
      .select("business_id, kind, day, count")
      .gte("day", metricsFrom)
      .limit(ROW_LIMIT),
  ]);

  const businesses = take(businessesRes, "Negocios", notes) as AdminBusiness[];
  const orderRows = take(orderRowsRes, "Pedidos", notes) as (Pick<
    Order,
    "business_id" | "status" | "total_cents" | "currency" | "created_at"
  >)[];
  const subscriptions = take(subscriptionsRes, "Suscripciones", notes) as PaddleSubscription[];

  // Métricas: si la 0009 no está aplicada, la tabla no existe. Se degrada a
  // «sin datos» con el aviso, en vez de tumbar la página entera.
  const metricRows = metricsRes.error ? [] : ((metricsRes.data as MetricRow[] | null) ?? []);
  let metrics: MetricsSummary;
  if (metricsRes.error) {
    notes.push(describeError("Métricas (page_metric)", metricsRes.error));
    metrics = emptyMetrics(false);
  } else {
    metrics = buildMetrics(metricRows);
    if (metricRows.length >= ROW_LIMIT) {
      notes.push(
        `Métricas: se leyeron las primeras ${ROW_LIMIT.toLocaleString("es-EC")} filas de los últimos ${METRIC_DAYS} días; la serie puede estar incompleta.`,
      );
    }
  }

  // ── Negocios: altas y reparto por plan ──
  const plans: Record<PlanTier, number> = { free: 0, starter: 0, pro: 0, business: 0 };
  let last7 = 0;
  let last30 = 0;
  for (const b of businesses) {
    if (b.plan in plans) plans[b.plan] += 1;
    if (b.created_at >= since7) last7 += 1;
    if (b.created_at >= since30) last30 += 1;
  }
  const paidBusinesses = businesses.length - plans.free;

  // ── Suscripciones por estado ──
  const subsByBusiness = new Map<string, PaddleSubscription[]>();
  const counters = { active: 0, trialing: 0, pastDue: 0, paused: 0, canceled: 0, other: 0 };
  for (const sub of subscriptions) {
    if (sub.business_id) {
      const list = subsByBusiness.get(sub.business_id) ?? [];
      list.push(sub);
      subsByBusiness.set(sub.business_id, list);
    }
    switch (sub.status) {
      case "active":
        counters.active += 1;
        break;
      case "trialing":
        counters.trialing += 1;
        break;
      case "past_due":
        counters.pastDue += 1;
        break;
      case "paused":
        counters.paused += 1;
        break;
      case "canceled":
      case "cancelled":
        counters.canceled += 1;
        break;
      default:
        counters.other += 1;
    }
  }

  const businessById = new Map(businesses.map((b) => [b.id, b]));
  const scheduled: SubscriptionRow[] = subscriptions
    .filter((s) => Boolean(s.scheduled_change_at))
    .sort((a, b) => (a.scheduled_change_at ?? "").localeCompare(b.scheduled_change_at ?? ""))
    .map((subscription) => ({
      subscription,
      business: subscription.business_id
        ? (businessById.get(subscription.business_id) ?? null)
        : null,
      customerEmail: null,
    }));

  // ── Plan que no cuadra con la suscripción ──
  const mismatches: AdminOverview["mismatches"] = [];
  for (const b of businesses) {
    const live = (subsByBusiness.get(b.id) ?? []).find((s) => isLiveStatus(s.status));
    if (b.plan !== "free" && !live) {
      mismatches.push({ business: b, subscriptionStatus: null });
    } else if (b.plan === "free" && live) {
      mismatches.push({ business: b, subscriptionStatus: live.status });
    }
  }

  // ── Pedidos: importes de las filas leídas ──
  const monthOrders = orderRows.filter((o) => o.created_at >= monthStart);

  return {
    businesses: {
      total: businessesRes.count ?? businesses.length,
      last7,
      last30,
    },
    plans,
    paidBusinesses,
    subscriptions: {
      total: subscriptionsRes.count ?? subscriptions.length,
      ...counters,
      scheduled,
    },
    mismatches,
    catalogs: {
      total: takeCount(catalogTotalRes, "Catálogos", notes),
      published: takeCount(catalogPublishedRes, "Catálogos publicados", notes),
    },
    products: {
      total: takeCount(productTotalRes, "Productos", notes),
      active: takeCount(productActiveRes, "Productos visibles", notes),
    },
    orders: {
      total: takeCount(orderTotalRes, "Pedidos (total)", notes),
      month: takeCount(orderMonthRes, "Pedidos del mes", notes),
      pending: takeCount(orderPendingRes, "Pedidos pendientes", notes),
      monthValue: sumByCurrency(monthOrders),
      readValue: sumByCurrency(orderRows),
    },
    metrics,
    monthStart,
    notes,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Listado de negocios
// ───────────────────────────────────────────────────────────────────────────

/**
 * Un negocio por fila con todas sus cifras.
 *
 * Seis lecturas en total (negocios, catálogos, productos, pedidos, métricas,
 * suscripciones) más la de cuentas de Auth, independientemente de cuántos
 * negocios haya. El cruce se hace con `Map` en memoria.
 */
export async function loadBusinessList(): Promise<{ rows: BusinessStats[]; notes: string[] }> {
  const db = createServiceClient();
  const notes: string[] = [];

  const [businessesRes, catalogsRes, productsRes, ordersRes, metricsRes, subsRes, owners] =
    await Promise.all([
      db.from("business").select("*").order("created_at", { ascending: false }).limit(ROW_LIMIT),
      db.from("catalog").select("business_id, is_public").limit(ROW_LIMIT),
      db.from("product").select("business_id").limit(ROW_LIMIT),
      db.from("order").select("business_id, status, total_cents, currency").limit(ROW_LIMIT),
      db.from("page_metric").select("business_id, kind, count").limit(ROW_LIMIT),
      db.from("paddle_subscription").select("*").limit(ROW_LIMIT),
      loadOwnerAccounts(notes),
    ]);

  const businesses = take(businessesRes, "Negocios", notes) as AdminBusiness[];
  const catalogs = take(catalogsRes, "Catálogos", notes) as {
    business_id: string;
    is_public: boolean | null;
  }[];
  const products = take(productsRes, "Productos", notes) as { business_id: string }[];
  const orders = take(ordersRes, "Pedidos", notes) as Pick<
    Order,
    "business_id" | "status" | "total_cents" | "currency"
  >[];
  const subs = take(subsRes, "Suscripciones", notes) as PaddleSubscription[];

  let metrics: { business_id: string; kind: MetricKind; count: number }[] = [];
  if (metricsRes.error) {
    notes.push(describeError("Métricas (page_metric)", metricsRes.error));
  } else {
    metrics = take(metricsRes, "Métricas", notes) as typeof metrics;
  }

  // ── Índices por negocio ──
  const catalogCount = new Map<string, number>();
  const publishedCount = new Map<string, number>();
  for (const c of catalogs) {
    catalogCount.set(c.business_id, (catalogCount.get(c.business_id) ?? 0) + 1);
    if (c.is_public) publishedCount.set(c.business_id, (publishedCount.get(c.business_id) ?? 0) + 1);
  }

  const productCount = new Map<string, number>();
  for (const p of products) {
    productCount.set(p.business_id, (productCount.get(p.business_id) ?? 0) + 1);
  }

  const orderCount = new Map<string, number>();
  const pendingCount = new Map<string, number>();
  const orderValue = new Map<string, MoneyByCurrency>();
  for (const o of orders) {
    orderCount.set(o.business_id, (orderCount.get(o.business_id) ?? 0) + 1);
    if (o.status === "pending") {
      pendingCount.set(o.business_id, (pendingCount.get(o.business_id) ?? 0) + 1);
    }
    if (o.status !== "cancelled") {
      const money = orderValue.get(o.business_id) ?? {};
      const key = o.currency || "USD";
      money[key] = (money[key] ?? 0) + o.total_cents;
      orderValue.set(o.business_id, money);
    }
  }

  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  for (const m of metrics) {
    if (m.kind === "business_view" || m.kind === "catalog_view") {
      views.set(m.business_id, (views.get(m.business_id) ?? 0) + (m.count ?? 0));
    } else if (m.kind === "whatsapp_click") {
      clicks.set(m.business_id, (clicks.get(m.business_id) ?? 0) + (m.count ?? 0));
    }
  }

  // Si un negocio tiene varias, manda la viva; si no, la más reciente.
  const subByBusiness = new Map<string, PaddleSubscription>();
  for (const sub of subs) {
    if (!sub.business_id) continue;
    const current = subByBusiness.get(sub.business_id);
    if (!current) {
      subByBusiness.set(sub.business_id, sub);
      continue;
    }
    const better =
      (isLiveStatus(sub.status) && !isLiveStatus(current.status)) ||
      (isLiveStatus(sub.status) === isLiveStatus(current.status) &&
        sub.updated_at > current.updated_at);
    if (better) subByBusiness.set(sub.business_id, sub);
  }

  const rows: BusinessStats[] = businesses.map((business) => {
    const owner = owners.get(business.owner_id) ?? null;
    return {
      business,
      ownerEmail: owner?.email ?? business.email ?? null,
      lastSignInAt: owner?.lastSignInAt ?? null,
      catalogs: catalogCount.get(business.id) ?? 0,
      publishedCatalogs: publishedCount.get(business.id) ?? 0,
      products: productCount.get(business.id) ?? 0,
      orders: orderCount.get(business.id) ?? 0,
      pendingOrders: pendingCount.get(business.id) ?? 0,
      orderValue: orderValue.get(business.id) ?? {},
      views: views.get(business.id) ?? 0,
      whatsappClicks: clicks.get(business.id) ?? 0,
      subscription: subByBusiness.get(business.id) ?? null,
    };
  });

  return { rows, notes };
}

// ───────────────────────────────────────────────────────────────────────────
// Suscripciones
// ───────────────────────────────────────────────────────────────────────────

/** Todas las suscripciones de Paddle con su negocio y el correo del cliente. */
export async function loadSubscriptions(): Promise<{ rows: SubscriptionRow[]; notes: string[] }> {
  const db = createServiceClient();
  const notes: string[] = [];

  const [subsRes, businessesRes, customersRes] = await Promise.all([
    db
      .from("paddle_subscription")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(ROW_LIMIT),
    db.from("business").select("*").limit(ROW_LIMIT),
    db.from("paddle_customer").select("customer_id, email, business_id").limit(ROW_LIMIT),
  ]);

  const subs = take(subsRes, "Suscripciones", notes) as PaddleSubscription[];
  const businesses = take(businessesRes, "Negocios", notes) as AdminBusiness[];
  const customers = take(customersRes, "Clientes de Paddle", notes) as {
    customer_id: string;
    email: string;
    business_id: string | null;
  }[];

  const businessById = new Map(businesses.map((b) => [b.id, b]));
  const emailByCustomer = new Map(customers.map((c) => [c.customer_id, c.email]));

  const rows = subs.map((subscription) => ({
    subscription,
    business: subscription.business_id ? (businessById.get(subscription.business_id) ?? null) : null,
    customerEmail: emailByCustomer.get(subscription.customer_id) ?? null,
  }));

  return { rows, notes };
}

// ───────────────────────────────────────────────────────────────────────────
// Pedidos
// ───────────────────────────────────────────────────────────────────────────

/** Los pedidos más recientes de toda la plataforma. */
export async function loadRecentOrders(
  limit = 150,
): Promise<{ rows: OrderRow[]; total: number; notes: string[] }> {
  const db = createServiceClient();
  const notes: string[] = [];

  const [ordersRes, businessesRes, totalRes] = await Promise.all([
    db.from("order").select("*").order("created_at", { ascending: false }).limit(limit),
    db.from("business").select("*").limit(ROW_LIMIT),
    db.from("order").select("id", { count: "exact", head: true }),
  ]);

  const orders = take(ordersRes, "Pedidos", notes) as Order[];
  const businesses = take(businessesRes, "Negocios", notes) as AdminBusiness[];
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  return {
    rows: orders.map((order) => ({
      order,
      business: businessById.get(order.business_id) ?? null,
    })),
    total: takeCount(totalRes, "Pedidos (total)", notes),
    notes,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Métricas
// ───────────────────────────────────────────────────────────────────────────

/** Totales de un negocio en la ventana de métricas. */
export interface BusinessMetricRow {
  businessId: string;
  business: AdminBusiness | null;
  views: number;
  clicks: number;
  ordersSent: number;
}

export interface MetricsPage {
  metrics: MetricsSummary;
  /** Negocios con actividad en la ventana, de más visitas a menos. */
  byBusiness: BusinessMetricRow[];
  from: string;
  to: string;
  notes: string[];
}

/**
 * Visitas y clics de los últimos `METRIC_DAYS` días, en total y por negocio.
 *
 * Dos lecturas: `page_metric` filtrada por fecha y `business` para los
 * nombres. El cruce es un `Map`, no una consulta por negocio.
 */
export async function loadMetrics(): Promise<MetricsPage> {
  const db = createServiceClient();
  const notes: string[] = [];
  const days = lastUtcDays(METRIC_DAYS);
  const from = days[0];
  const to = days[days.length - 1];

  const [metricsRes, businessesRes] = await Promise.all([
    db
      .from("page_metric")
      .select("business_id, kind, day, count")
      .gte("day", from)
      .limit(ROW_LIMIT),
    db.from("business").select("*").limit(ROW_LIMIT),
  ]);

  const businesses = take(businessesRes, "Negocios", notes) as AdminBusiness[];
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  if (metricsRes.error) {
    notes.push(describeError("Métricas (page_metric)", metricsRes.error));
    return { metrics: emptyMetrics(false), byBusiness: [], from, to, notes };
  }

  const rows = take(metricsRes, "Métricas", notes) as MetricRow[];
  const metrics = buildMetrics(rows);

  const totals = new Map<string, BusinessMetricRow>();
  for (const row of rows) {
    const entry =
      totals.get(row.business_id) ??
      ({
        businessId: row.business_id,
        business: businessById.get(row.business_id) ?? null,
        views: 0,
        clicks: 0,
        ordersSent: 0,
      } satisfies BusinessMetricRow);
    const count = row.count ?? 0;
    if (row.kind === "business_view" || row.kind === "catalog_view") entry.views += count;
    else if (row.kind === "whatsapp_click") entry.clicks += count;
    else if (row.kind === "order_sent") entry.ordersSent += count;
    totals.set(row.business_id, entry);
  }

  const byBusiness = [...totals.values()].sort(
    (a, b) => b.views - a.views || b.clicks - a.clicks,
  );

  return { metrics, byBusiness, from, to, notes };
}

// ───────────────────────────────────────────────────────────────────────────
// Detalle de un negocio
// ───────────────────────────────────────────────────────────────────────────

/**
 * Ficha completa de un negocio, para soporte.
 *
 * Devuelve `null` solo cuando ese negocio no existe (o el id no es un uuid).
 * Si la consulta falla por cualquier otro motivo, LANZA: un 404 diría «este
 * negocio no existe» cuando la verdad es «no se pudo preguntar», y el límite
 * de error ofrece reintentar.
 */
export async function loadBusinessDetail(id: string): Promise<BusinessDetail | null> {
  const db = createServiceClient();
  const notes: string[] = [];

  const businessRes = await db.from("business").select("*").eq("id", id).maybeSingle();
  if (businessRes.error) {
    // 22P02 = sintaxis de uuid inválida: el id de la URL no puede existir.
    if (businessRes.error.code === "22P02") return null;
    throw new Error(describeError("Negocio", businessRes.error));
  }
  const business = businessRes.data as AdminBusiness | null;
  if (!business) return null;

  const metricsFrom = lastUtcDays(METRIC_DAYS)[0];

  const [
    catalogsRes,
    productTotalRes,
    productActiveRes,
    recentProductsRes,
    ordersRes,
    orderTotalRes,
    orderPendingRes,
    subsRes,
    customersRes,
    metricsRes,
    owners,
  ] = await Promise.all([
    db
      .from("catalog")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(500),
    db.from("product").select("id", { count: "exact", head: true }).eq("business_id", id),
    db
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id)
      .eq("active", true),
    db
      .from("product")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(12),
    db
      .from("order")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("order").select("id", { count: "exact", head: true }).eq("business_id", id),
    db
      .from("order")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id)
      .eq("status", "pending"),
    db
      .from("paddle_subscription")
      .select("*")
      .eq("business_id", id)
      .order("updated_at", { ascending: false }),
    db.from("paddle_customer").select("customer_id, email").eq("business_id", id),
    db
      .from("page_metric")
      .select("business_id, kind, day, count")
      .eq("business_id", id)
      .gte("day", metricsFrom)
      .limit(ROW_LIMIT),
    loadOwnerAccounts(notes),
  ]);

  const orders = take(ordersRes, "Pedidos del negocio", notes) as Order[];
  const subs = take(subsRes, "Suscripciones del negocio", notes) as PaddleSubscription[];
  const customers = take(customersRes, "Clientes de Paddle", notes) as {
    customer_id: string;
    email: string;
  }[];
  const emailByCustomer = new Map(customers.map((c) => [c.customer_id, c.email]));

  let metrics: MetricsSummary;
  if (metricsRes.error) {
    notes.push(describeError("Métricas (page_metric)", metricsRes.error));
    metrics = emptyMetrics(false);
  } else {
    metrics = buildMetrics((metricsRes.data as MetricRow[] | null) ?? []);
  }

  return {
    business,
    owner: owners.get(business.owner_id) ?? null,
    catalogs: take(catalogsRes, "Catálogos del negocio", notes) as Catalog[],
    products: {
      total: takeCount(productTotalRes, "Productos del negocio", notes),
      active: takeCount(productActiveRes, "Productos visibles", notes),
      recent: take(recentProductsRes, "Productos recientes", notes) as Product[],
    },
    orders: {
      total: takeCount(orderTotalRes, "Pedidos del negocio (total)", notes),
      pending: takeCount(orderPendingRes, "Pedidos pendientes del negocio", notes),
      value: sumByCurrency(orders),
      recent: orders.slice(0, 20),
    },
    subscriptions: subs.map((subscription) => ({
      subscription,
      business,
      customerEmail: emailByCustomer.get(subscription.customer_id) ?? null,
    })),
    metrics,
    notes,
  };
}
