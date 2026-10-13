import express, { type Express } from "express";
import { healthRouter } from "@/routes/health.route.js";

/**
 * Construye la app de Express. Se separa de `server.ts` para poder montarla en
 * tests sin abrir un puerto. Los middlewares de seguridad y las rutas de
 * dominio se irán enchufando aquí.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/health", healthRouter);

  return app;
}
