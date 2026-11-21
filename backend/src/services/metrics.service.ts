import type { Collection, Document } from "mongodb";
import { EVENTS_COLLECTION, getMetricsDb } from "@/lib/mongo.js";
import { ApiError } from "@/lib/errors.js";
import {
  METRIC_KINDS,
  type BusinessMetrics,
  type MetricBusinessRow,
  type MetricCatalogRow,
  type MetricCountryRow,
  type MetricDayRow,
  type MetricEventDoc,
  type MetricTotals,
  type MetricsSummary,
} from "@/types/metrics.js";

/**
 * Analítica sobre MongoDB.
 *
 * Las lecturas se resuelven con **pipelines de agregación**, no trayendo
 * documentos y sumando en JavaScript: agrupar un mes de eventos en el servidor
 * de base de datos es lo que hace que esto escale (y es para lo que están los
 * índices `{ businessId, at }` y `{ kind, at }`). Lo único que se hace en JS es
 * rellenar con ceros los días sin eventos, porque un día que no existe no puede
 * salir de un `$group`.
 *
 * Todos los días se calculan en **UTC**, igual que hacía el contador de
 * Postgres, para que el panel no cambie de cifras según el huso del servidor.
 */

const MS_PER_DAY = 86_400_000;

/** Tope de filas en los desgloses: el panel muestra un ranking, no un listado. */
const BREAKDOWN_LIMIT = 50;

async function eventsCollection(): Promise<Collection<MetricEventDoc> | null> {
  const db = await getMetricsDb();
  return db ? db.collection<MetricEventDoc>(EVENTS_COLLECTION) : null;
}

/** Para las lecturas sí hay que avisar: no se pueden inventar datos. */
async function requireEvents(): Promise<Collection<MetricEventDoc>> {
  const events = await eventsCollection();
  if (!events) {
    throw new ApiError(
      503,
      "La analítica no está disponible ahora mismo.",
      "metrics_unavailable",
    );
  }
  return events;
}

/* -------------------------------------------------------------------------- */
/* Días en UTC                                                                */
/* -------------------------------------------------------------------------- */

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Inicio de la ventana: hoy 00:00 UTC menos (days - 1) días. */
function windowStart(days: number): Date {
  return new Date(startOfUtcDay(new Date()).getTime() - (days - 1) * MS_PER_DAY);
}

/** Lista de días `YYYY-MM-DD` de la ventana, en orden. */
function utcDayKeys(days: number): string[] {
  const first = windowStart(days).getTime();
  return Array.from({ length: days }, (_, i) =>
    new Date(first + i * MS_PER_DAY).toISOString().slice(0, 10),
  );
}

/* -------------------------------------------------------------------------- */
/* Piezas de pipeline                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Acumuladores `{ business_view: { $sum: ... }, ... }`: un contador por tipo de
 * evento dentro del mismo `$group`, para no pagar un `$group` por tipo.
 */
const COUNT_BY_KIND: Document = Object.fromEntries(
  METRIC_KINDS.map((kind) => [kind, { $sum: { $cond: [{ $eq: ["$kind", kind] }, 1, 0] } }]),
);

/** Proyección que deja fuera `_id` y mantiene los tres contadores. */
const KIND_FIELDS: Document = Object.fromEntries(METRIC_KINDS.map((kind) => [kind, 1]));

/** Suma de los tres contadores, para ordenar los desgloses por actividad. */
const TOTAL_EXPR: Document = { $add: METRIC_KINDS.map((kind) => `$${kind}`) };

const TOTALS_STAGES: Document[] = [
  { $group: { _id: null, ...COUNT_BY_KIND } },
  { $project: { _id: 0, ...KIND_FIELDS } },
];

const SERIES_STAGES: Document[] = [
  // `$dateTrunc` agrupa por día en UTC dentro del propio servidor.
  {
    $group: {
      _id: { $dateTrunc: { date: "$at", unit: "day", timezone: "UTC" } },
      ...COUNT_BY_KIND,
    },
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      _id: 0,
      day: { $dateToString: { date: "$_id", format: "%Y-%m-%d", timezone: "UTC" } },
      ...KIND_FIELDS,
    },
  },
];

function emptyTotals(): MetricTotals {
  return { business_view: 0, catalog_view: 0, whatsapp_click: 0 };
}

/** Normaliza una fila del pipeline: si un tipo no apareció, vale 0. */
function totalsOf(row: Partial<MetricTotals> | undefined): MetricTotals {
  const out = emptyTotals();
  for (const kind of METRIC_KINDS) out[kind] = row?.[kind] ?? 0;
  return out;
}

/**
 * Serie completa: los días sin eventos entran a cero para que el gráfico no
 * tenga huecos (el `$group` solo devuelve los días que existen).
 */
function fillSeries(days: number, rows: MetricDayRow[]): MetricDayRow[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return utcDayKeys(days).map((day) => ({ day, ...totalsOf(byDay.get(day)) }));
}

/* -------------------------------------------------------------------------- */
/* Escritura                                                                  */
/* -------------------------------------------------------------------------- */

/** Para no repetir el mismo error de escritura en el log cada segundo. */
let lastWriteErrorAt = 0;
const WRITE_ERROR_LOG_INTERVAL_MS = 60_000;

export const metricsService = {
  /**
   * Guarda un evento. Devuelve `false` si se descartó (sin Mongo o error de
   * escritura) y nunca lanza: el beacon ya respondió 204 y perder una visita no
   * es un incidente.
   */
  async record(event: MetricEventDoc): Promise<boolean> {
    const events = await eventsCollection();
    if (!events) return false;

    try {
      await events.insertOne(event);
      return true;
    } catch (err) {
      const now = Date.now();
      if (now - lastWriteErrorAt > WRITE_ERROR_LOG_INTERVAL_MS) {
        lastWriteErrorAt = now;
        console.warn(
          `[metrics] evento descartado: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return false;
    }
  },

  /**
   * Resumen global (panel de administración).
   *
   * Un solo `$facet` para que los cuatro desgloses compartan el mismo `$match`
   * y la misma pasada por el índice, en vez de cuatro viajes al cluster.
   */
  async summary(days: number): Promise<MetricsSummary> {
    const events = await requireEvents();

    interface Facets {
      totals: Partial<MetricTotals>[];
      series: MetricDayRow[];
      byBusiness: MetricBusinessRow[];
      byCountry: MetricCountryRow[];
    }

    const [facets] = await events
      .aggregate<Facets>([
        { $match: { at: { $gte: windowStart(days) } } },
        {
          $facet: {
            totals: TOTALS_STAGES,
            series: SERIES_STAGES,
            byBusiness: [
              {
                $group: {
                  _id: "$businessId",
                  // `$top` se queda con el slug del evento más reciente: si el
                  // dueño renombró el negocio, el panel muestra el nombre nuevo.
                  businessSlug: { $top: { sortBy: { at: -1 }, output: "$businessSlug" } },
                  ...COUNT_BY_KIND,
                },
              },
              { $addFields: { total: TOTAL_EXPR } },
              { $sort: { total: -1, _id: 1 } },
              { $limit: BREAKDOWN_LIMIT },
              {
                $project: {
                  _id: 0,
                  businessId: "$_id",
                  businessSlug: 1,
                  ...KIND_FIELDS,
                },
              },
            ],
            byCountry: [
              { $match: { country: { $ne: null } } },
              { $group: { _id: "$country", count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } },
              { $limit: BREAKDOWN_LIMIT },
              { $project: { _id: 0, country: "$_id", count: 1 } },
            ],
          },
        },
      ])
      .toArray();

    return {
      days,
      totals: totalsOf(facets?.totals[0]),
      series: fillSeries(days, facets?.series ?? []),
      byBusiness: facets?.byBusiness ?? [],
      byCountry: facets?.byCountry ?? [],
    };
  },

  /** Mismo resumen acotado a un negocio, con desglose por catálogo. */
  async forBusiness(businessId: string, days: number): Promise<BusinessMetrics> {
    const events = await requireEvents();

    interface Facets {
      totals: Partial<MetricTotals>[];
      series: MetricDayRow[];
      byCatalog: MetricCatalogRow[];
    }

    const [facets] = await events
      .aggregate<Facets>([
        // Entra por el índice { businessId: 1, at: -1 }.
        { $match: { businessId, at: { $gte: windowStart(days) } } },
        {
          $facet: {
            totals: TOTALS_STAGES,
            series: SERIES_STAGES,
            byCatalog: [
              {
                $group: {
                  // `null` agrupa los eventos de la página del negocio, que no
                  // pertenecen a ningún catálogo.
                  _id: "$catalogId",
                  catalogSlug: { $top: { sortBy: { at: -1 }, output: "$catalogSlug" } },
                  ...COUNT_BY_KIND,
                },
              },
              { $addFields: { total: TOTAL_EXPR } },
              { $sort: { total: -1, _id: 1 } },
              { $limit: BREAKDOWN_LIMIT },
              { $project: { _id: 0, catalogId: "$_id", catalogSlug: 1, ...KIND_FIELDS } },
            ],
          },
        },
      ])
      .toArray();

    return {
      days,
      businessId,
      totals: totalsOf(facets?.totals[0]),
      series: fillSeries(days, facets?.series ?? []),
      byCatalog: facets?.byCatalog ?? [],
    };
  },
};
