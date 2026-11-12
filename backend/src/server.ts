import { env } from "@/config/env.js";
import { createApp } from "@/app.js";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[catalii-backend] escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
});

/** Apagado ordenado: deja terminar las peticiones en curso antes de salir. */
function shutdown(signal: string) {
  console.log(`\n[catalii-backend] ${signal} recibido, cerrando…`);
  server.close(() => process.exit(0));
  // Si algo se queda colgado, no esperar para siempre.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
