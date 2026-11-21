/**
 * Comprobación de la analítica contra un MongoDB real, sin cluster ni Docker.
 *
 *   cd backend && node_modules/.bin/tsx scripts/check-metrics.ts
 *
 * Levanta un `mongod` en memoria (mongodb-memory-server descarga el binario la
 * primera vez y lo deja en caché), crea los índices, escribe eventos y ejecuta
 * los pipelines de `metrics.service.ts` comprobando los números. Existe porque
 * los pipelines son la parte que no se puede validar leyendo el código: un
 * `$facet` mal armado compila igual de bien.
 *
 * No es un test unitario ni corre en CI por defecto: es la red de seguridad
 * para cuando se toquen las agregaciones.
 */
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
// Solo el tipo: un `import type` no carga el módulo, así que no adelanta la
// lectura del entorno que hacen los módulos de abajo.
import type { MetricEventDoc } from "@/types/metrics.js";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();

// El entorno se prepara ANTES de importar `config/env.js`, que lo lee al cargar.
process.env.MONGODB_URI = uri;
process.env.MONGODB_DB = "catalii_check";
process.env.METRICS_RETENTION_DAYS = "180";
process.env.SUPABASE_URL ??= "http://127.0.0.1:9";
process.env.SUPABASE_ANON_KEY ??= "x";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "y";

const { getMetricsDb, ensureMetricsIndexes, closeMongo, EVENTS_COLLECTION, mongoHealth } =
  await import("@/lib/mongo.js");
const { metricsService } = await import("@/services/metrics.service.js");
const { METRIC_KINDS } = await import("@/types/metrics.js");

const DAY_MS = 86_400_000;
const RETENTION_SECONDS = 180 * DAY_MS / 1000;

function utcDay(offsetDays: number): Date {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // Media mañana del día pedido, para no quedar en el filo de la medianoche.
  return new Date(start - offsetDays * DAY_MS + 10 * 3_600_000);
}

function dayKey(offsetDays: number): string {
  return utcDay(offsetDays).toISOString().slice(0, 10);
}

const B1 = "11111111-1111-1111-1111-111111111111";
const B2 = "22222222-2222-2222-2222-222222222222";
const C1 = "aaaaaaaa-1111-1111-1111-111111111111";

function evt(partial: Partial<MetricEventDoc>): MetricEventDoc {
  return {
    kind: "catalog_view",
    businessId: B1,
    businessSlug: "enermo",
    catalogId: C1,
    catalogSlug: "verano",
    at: utcDay(0),
    country: "EC",
    referrerHost: null,
    device: null,
    ...partial,
  };
}

const db = await getMetricsDb();
assert.ok(db, "getMetricsDb() debería conectar contra el mongod en memoria");
assert.deepEqual(mongoHealth(), { enabled: true, connected: true });

/* -------------------------------------------------------------------------- */
/* 1. Índices (incluido el ajuste del TTL ya existente)                       */
/* -------------------------------------------------------------------------- */

// Se crea el TTL con otra retención para forzar el camino del conflicto de
// opciones: es lo que pasa en producción al cambiar METRICS_RETENTION_DAYS.
await db.collection(EVENTS_COLLECTION).createIndexes([
  { key: { at: 1 }, name: "events_at_ttl", expireAfterSeconds: 60 },
]);

await ensureMetricsIndexes(db);

const indexes = await db.collection(EVENTS_COLLECTION).indexes();
const ttl = indexes.find((i) => i.name === "events_at_ttl");
assert.ok(ttl, "falta el índice TTL events_at_ttl");
assert.deepEqual(ttl.key, { at: 1 });
assert.equal(
  ttl.expireAfterSeconds,
  RETENTION_SECONDS,
  "el TTL debería haberse ajustado a METRICS_RETENTION_DAYS con collMod",
);
assert.ok(
  indexes.some((i) => i.name === "events_business_at"),
  "falta el índice { businessId: 1, at: -1 }",
);
assert.ok(
  indexes.some((i) => i.name === "events_kind_at"),
  "falta el índice { kind: 1, at: -1 }",
);

// Idempotencia: volver a llamar no debe fallar ni duplicar índices.
await ensureMetricsIndexes(db);
assert.equal((await db.collection(EVENTS_COLLECTION).indexes()).length, indexes.length);

console.log("✔ índices: TTL ajustado a 180 días, consulta por negocio y por tipo, idempotente");

/* -------------------------------------------------------------------------- */
/* 2. Escritura                                                               */
/* -------------------------------------------------------------------------- */

const fixtures: MetricEventDoc[] = [
  // Hoy, negocio 1, catálogo "verano".
  evt({ kind: "catalog_view" }),
  evt({ kind: "catalog_view", device: "mobile", referrerHost: "instagram.com" }),
  evt({ kind: "whatsapp_click", device: "desktop" }),
  // Hoy, negocio 1, página del negocio (sin catálogo).
  evt({ kind: "business_view", catalogId: null, catalogSlug: null, country: "CO" }),
  // Hace 2 días, negocio 1, el catálogo tenía otro slug (se renombró).
  evt({ kind: "catalog_view", at: utcDay(2), catalogSlug: "verano-viejo" }),
  // Negocio 2, con el slug renombrado en el evento más reciente.
  evt({
    kind: "catalog_view",
    at: utcDay(3),
    businessId: B2,
    businessSlug: "ferreteria-vieja",
    catalogId: null,
    catalogSlug: null,
    country: null,
  }),
  evt({
    kind: "business_view",
    at: utcDay(1),
    businessId: B2,
    businessSlug: "ferreteria",
    catalogId: null,
    catalogSlug: null,
    country: "PE",
  }),
  // Fuera de la ventana de 7 días: no debe aparecer en ningún total.
  evt({ kind: "catalog_view", at: utcDay(30) }),
];

for (const doc of fixtures) {
  assert.equal(await metricsService.record(doc), true, "record() debería escribir");
}
assert.equal(await db.collection(EVENTS_COLLECTION).countDocuments(), fixtures.length);
console.log(`✔ escritura: ${fixtures.length} eventos insertados`);

/* -------------------------------------------------------------------------- */
/* 3. summary()                                                               */
/* -------------------------------------------------------------------------- */

const summary = await metricsService.summary(7);

assert.equal(summary.days, 7);
assert.deepEqual(
  summary.totals,
  { business_view: 2, catalog_view: 4, whatsapp_click: 1 },
  "totales de la ventana de 7 días (el evento de hace 30 días queda fuera)",
);

assert.equal(summary.series.length, 7, "la serie debe traer los 7 días, con o sin eventos");
assert.deepEqual(
  summary.series.map((d) => d.day),
  [6, 5, 4, 3, 2, 1, 0].map(dayKey),
  "los días deben ir en orden y en UTC",
);
assert.deepEqual(summary.series.at(-1), {
  day: dayKey(0),
  business_view: 1,
  catalog_view: 2,
  whatsapp_click: 1,
});
assert.deepEqual(
  summary.series[0],
  { day: dayKey(6), business_view: 0, catalog_view: 0, whatsapp_click: 0 },
  "un día sin eventos debe venir a cero, no faltar",
);
for (const kind of METRIC_KINDS) {
  assert.equal(
    summary.series.reduce((acc, d) => acc + d[kind], 0),
    summary.totals[kind],
    `la serie y los totales no cuadran en ${kind}`,
  );
}

assert.deepEqual(summary.byBusiness, [
  { businessId: B1, businessSlug: "enermo", business_view: 1, catalog_view: 3, whatsapp_click: 1 },
  {
    businessId: B2,
    // $top: el slug del evento más reciente, no el primero que se guardó.
    businessSlug: "ferreteria",
    business_view: 1,
    catalog_view: 1,
    whatsapp_click: 0,
  },
]);

assert.deepEqual(
  summary.byCountry,
  [
    { country: "EC", count: 4 },
    { country: "CO", count: 1 },
    { country: "PE", count: 1 },
  ],
  "byCountry ordenado por volumen y sin el país nulo",
);
console.log("✔ summary(): totales, serie rellenada en UTC, byBusiness y byCountry");

/* -------------------------------------------------------------------------- */
/* 4. forBusiness()                                                           */
/* -------------------------------------------------------------------------- */

const business = await metricsService.forBusiness(B1, 7);

assert.equal(business.businessId, B1);
assert.deepEqual(business.totals, { business_view: 1, catalog_view: 3, whatsapp_click: 1 });
assert.equal(business.series.length, 7);
assert.deepEqual(business.byCatalog, [
  { catalogId: C1, catalogSlug: "verano", business_view: 0, catalog_view: 3, whatsapp_click: 1 },
  // Los eventos de la página del negocio no tienen catálogo.
  { catalogId: null, catalogSlug: null, business_view: 1, catalog_view: 0, whatsapp_click: 0 },
]);

const empty = await metricsService.forBusiness("33333333-3333-3333-3333-333333333333", 3);
assert.deepEqual(empty.totals, { business_view: 0, catalog_view: 0, whatsapp_click: 0 });
assert.equal(empty.series.length, 3);
assert.deepEqual(empty.byCatalog, []);
console.log("✔ forBusiness(): acotado al negocio, byCatalog y negocio sin datos");

/* -------------------------------------------------------------------------- */
/* 5. ¿Usan los índices?                                                      */
/* -------------------------------------------------------------------------- */

const explain = (await db
  .collection(EVENTS_COLLECTION)
  .aggregate([{ $match: { businessId: B1, at: { $gte: utcDay(7) } } }, { $count: "n" }])
  .explain("queryPlanner")) as { queryPlanner?: { winningPlan?: unknown } };

const plan = JSON.stringify(explain.queryPlanner?.winningPlan ?? explain);
assert.ok(plan.includes("events_business_at"), `el $match no usó el índice: ${plan}`);
console.log("✔ plan de consulta: el $match entra por events_business_at");

await closeMongo();
await mongod.stop();
console.log("\nTodo correcto.");
