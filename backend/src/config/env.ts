import "dotenv/config";
import { z } from "zod";

/**
 * Lee y valida las variables de entorno al arrancar. Si falta algo crítico el
 * proceso no debe levantar: es mejor fallar aquí que a mitad de una petición.
 */
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: z.string().url("SUPABASE_URL debe ser una URL válida"),
  SUPABASE_ANON_KEY: z.string().min(1, "Falta SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Falta SUPABASE_SERVICE_ROLE_KEY"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  /**
   * MongoDB para la analítica. **Opcional a propósito**: si falta, el backend
   * arranca igual y solo se desactivan las rutas de métricas. Hacerla
   * obligatoria convertiría a Mongo en dependencia de disponibilidad de los
   * pedidos, que es justo lo que se quiere evitar (ver backend/README.md).
   */
  MONGODB_URI: z
    .string()
    .trim()
    .default("")
    .refine(
      (v) => v === "" || /^mongodb(\+srv)?:\/\/.+/.test(v),
      "MONGODB_URI debe empezar por mongodb:// o mongodb+srv://",
    ),
  MONGODB_DB: z.string().trim().min(1).default("catalii"),
  /** Días que se guardan los eventos; de aquí sale el TTL del índice. */
  METRICS_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(180),
  /** Correos con acceso a las métricas globales, separados por coma. */
  ADMIN_EMAILS: z.string().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues.map((i) => `  · ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`\n[config] Variables de entorno inválidas:\n${detail}\n`);
  console.error("Copia backend/.env.example a backend/.env y complétalo.\n");
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  port: raw.PORT,
  nodeEnv: raw.NODE_ENV,
  isProd: raw.NODE_ENV === "production",
  supabaseUrl: raw.SUPABASE_URL,
  supabaseAnonKey: raw.SUPABASE_ANON_KEY,
  supabaseServiceKey: raw.SUPABASE_SERVICE_ROLE_KEY,
  corsOrigins: raw.CORS_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  /** `null` = analítica desactivada (no hay cluster configurado). */
  mongoUri: raw.MONGODB_URI || null,
  mongoDb: raw.MONGODB_DB,
  metricsRetentionDays: raw.METRICS_RETENTION_DAYS,
  /** En minúsculas: el correo de Supabase se compara normalizado. */
  adminEmails: raw.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
} as const;
