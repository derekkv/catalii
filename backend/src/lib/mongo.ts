import { MongoClient, type Db, type MongoClientOptions } from "mongodb";
import { env } from "@/config/env.js";

/**
 * Conexión a MongoDB para la analítica.
 *
 * Decisiones (y por qué, porque esto condiciona al resto del backend):
 *
 *  · **Un solo cliente para todo el proceso.** El driver mantiene un pool de
 *    conexiones; abrir un cliente por petición pagaría el TCP + TLS cada vez
 *    (~300 ms). Esa es justamente la razón por la que las métricas viven aquí
 *    y no en el Worker (ver docs/METRICAS-API.md).
 *
 *  · **Conexión perezosa y opcional.** Si `MONGODB_URI` está vacía o el
 *    cluster no responde, `getMetricsDb()` devuelve `null` y quien llama
 *    decide: la escritura de eventos se descarta en silencio, las lecturas
 *    responden 503. Lo que NO pasa es que se caiga el backend: la analítica es
 *    prescindible, los pedidos no.
 *
 *  · **Reintento con espera.** Un fallo de conexión marca una pausa antes del
 *    siguiente intento, para no abrir un cliente nuevo en cada evento mientras
 *    el cluster esté caído. Una vez conectado, el reintento lo hace el propio
 *    driver (SDAM) sin crear clientes nuevos.
 */

/** Colección de eventos (contrato: docs/METRICAS-API.md). */
export const EVENTS_COLLECTION = "events";

/** Nombre del índice TTL, necesario para poder ajustarlo con `collMod`. */
const TTL_INDEX = "events_at_ttl";

const SECONDS_PER_DAY = 86_400;

/** Espera entre intentos de conexión tras un fallo. */
const RETRY_COOLDOWN_MS = 30_000;

const OPTIONS: MongoClientOptions = {
  appName: "catalii-backend",
  // El backend es un proceso pequeño: 10 conexiones sobran para la analítica y
  // dejan margen al límite de conexiones del cluster.
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  // Fallar rápido: ninguna petición HTTP debe quedarse esperando a Mongo.
  serverSelectionTimeoutMS: 3_000,
  connectTimeoutMS: 5_000,
  socketTimeoutMS: 15_000,
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db | null> | null = null;
/** Último estado conocido del cluster según los latidos del driver. */
let connected = false;
let nextAttemptAt = 0;

/** `true` si hay cluster configurado (no dice si responde). */
export function metricsEnabled(): boolean {
  return env.mongoUri !== null;
}

/** Estado para `/health`. No incluye la URI ni el host: solo si responde. */
export function mongoHealth(): { enabled: boolean; connected: boolean } {
  return { enabled: metricsEnabled(), connected: connected };
}

function reason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function connect(): Promise<Db | null> {
  const uri = env.mongoUri;
  if (!uri) return null;

  const candidate = new MongoClient(uri, OPTIONS);

  // Los latidos del driver son la única fuente honesta de "¿está arriba?".
  // No se registran en el log: fallan cada pocos segundos cuando el cluster
  // está caído y llenarían el log de ruido.
  candidate.on("serverHeartbeatSucceeded", () => {
    connected = true;
  });
  candidate.on("serverHeartbeatFailed", () => {
    connected = false;
  });

  try {
    await candidate.connect();
    client = candidate;
    db = candidate.db(env.mongoDb);
    connected = true;
    nextAttemptAt = 0;
    console.log(
      `[mongo] conectado a la base "${env.mongoDb}" (pool máx. ${OPTIONS.maxPoolSize}).`,
    );
    return db;
  } catch (err) {
    connected = false;
    nextAttemptAt = Date.now() + RETRY_COOLDOWN_MS;
    // El cliente fallido se descarta: el siguiente intento crea uno nuevo.
    await candidate.close().catch(() => undefined);
    console.warn(
      `[mongo] SIN CONEXIÓN (${reason(err)}). La analítica queda desactivada: ` +
        `los eventos se descartan y /api/metrics/* responde 503. El resto del ` +
        `backend funciona normal. Nuevo intento en ${RETRY_COOLDOWN_MS / 1000} s.`,
    );
    return null;
  }
}

/**
 * Base de datos de métricas, o `null` si no hay forma de usarla ahora mismo.
 * Nunca lanza: quien llama decide qué hacer sin Mongo.
 */
export async function getMetricsDb(): Promise<Db | null> {
  if (!env.mongoUri) return null;
  // Ya hay cliente: se reutiliza aunque el cluster esté momentáneamente caído,
  // porque el driver reconecta solo y las operaciones fallan con timeout.
  if (db) return db;
  if (connecting) return connecting;
  if (Date.now() < nextAttemptAt) return null; // en espera tras un fallo

  connecting = connect();
  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

/** 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict. */
function isIndexConflict(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return code === 85 || code === 86;
}

/**
 * Crea los índices del contrato. Idempotente: `createIndexes` no hace nada si
 * ya existen igual. El caso interesante es cambiar `METRICS_RETENTION_DAYS`:
 * entonces el TTL ya existe con otro `expireAfterSeconds` y Mongo responde
 * conflicto, así que se ajusta con `collMod` en vez de borrar y recrear.
 *
 * Nunca lanza: un fallo aquí no debe impedir arrancar ni escribir eventos.
 */
export async function ensureMetricsIndexes(database: Db): Promise<void> {
  const expireAfterSeconds = env.metricsRetentionDays * SECONDS_PER_DAY;
  const events = database.collection(EVENTS_COLLECTION);

  // El TTL se crea aparte de los de consulta: un conflicto de opciones en él no
  // debe dejar al negocio sin sus índices de lectura.
  try {
    await events.createIndexes([{ key: { at: 1 }, name: TTL_INDEX, expireAfterSeconds }]);
  } catch (err) {
    if (isIndexConflict(err)) {
      try {
        await database.command({
          collMod: EVENTS_COLLECTION,
          index: { name: TTL_INDEX, expireAfterSeconds },
        });
        console.log(`[mongo] TTL ajustado a ${env.metricsRetentionDays} días.`);
      } catch (modErr) {
        console.warn(`[mongo] no se pudo ajustar el TTL: ${reason(modErr)}`);
      }
    } else {
      console.warn(`[mongo] no se pudo crear el índice TTL: ${reason(err)}`);
    }
  }

  try {
    await events.createIndexes([
      { key: { businessId: 1, at: -1 }, name: "events_business_at" },
      { key: { kind: 1, at: -1 }, name: "events_kind_at" },
    ]);
    console.log(
      `[mongo] índices de métricas listos (retención ${env.metricsRetentionDays} días).`,
    );
  } catch (err) {
    console.warn(
      `[mongo] no se pudieron crear los índices de consulta: ${reason(err)}. ` +
        "Las agregaciones funcionarán, pero más lentas.",
    );
  }
}

/**
 * Se llama una vez al arrancar, sin `await` que bloquee el `listen`: intenta
 * conectar y preparar los índices, y si no puede lo deja dicho en el log.
 */
export async function initMongo(): Promise<void> {
  if (!env.mongoUri) {
    console.warn(
      "[mongo] MONGODB_URI vacía: la analítica está DESACTIVADA " +
        "(POST /api/metrics/events descarta los eventos y GET /api/metrics/* responde 503). " +
        "Define MONGODB_URI cuando el cluster exista.",
    );
    return;
  }
  const database = await getMetricsDb();
  if (!database) return; // connect() ya avisó en el log
  await ensureMetricsIndexes(database);
}

/** Cierre ordenado: devuelve las conexiones del pool al recibir SIGTERM/SIGINT. */
export async function closeMongo(): Promise<void> {
  const current = client;
  client = null;
  db = null;
  connected = false;
  if (!current) return;
  try {
    await current.close();
    console.log("[mongo] conexiones cerradas.");
  } catch (err) {
    console.warn(`[mongo] cierre con error: ${reason(err)}`);
  }
}
