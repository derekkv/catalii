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
} as const;
