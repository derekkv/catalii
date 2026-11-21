import { env } from "@/config/env.js";
import { createApp } from "@/app.js";
import { closeMongo, initMongo } from "@/lib/mongo.js";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[catalii-backend] escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  if (env.adminEmails.length === 0) {
    console.warn(
      "[auth] ADMIN_EMAILS está vacío: GET /api/metrics/summary responde 404 para todos. " +
        "Define ADMIN_EMAILS=correo@dominio.com (separa varios con comas).",
    );
  }
});

/**
 * Mongo se conecta DESPUÉS de empezar a escuchar y sin `await`: si el cluster
 * no existe o tarda, el backend ya está sirviendo pedidos. `initMongo` no lanza
 * nunca; deja el motivo en el log y la analítica queda desactivada.
 */
void initMongo();

/** Apagado ordenado: deja terminar las peticiones en curso antes de salir. */
function shutdown(signal: string) {
  console.log(`\n[catalii-backend] ${signal} recibido, cerrando…`);
  server.close(() => {
    // El pool de Mongo se cierra al final, cuando ya no hay peticiones que
    // puedan estar escribiendo un evento.
    void closeMongo().finally(() => process.exit(0));
  });
  // Si algo se queda colgado, no esperar para siempre.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
