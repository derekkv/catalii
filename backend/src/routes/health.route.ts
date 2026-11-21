import { Router } from "express";
import { mongoHealth } from "@/lib/mongo.js";

export const healthRouter = Router();

/**
 * Sonda simple para readiness/liveness y para comprobar que el server vive.
 *
 * `ok` sigue siendo `true` aunque Mongo esté caído: la analítica es
 * prescindible y reiniciar el contenedor por eso dejaría al negocio sin
 * pedidos. El estado de Mongo va aparte, para verlo sin entrar al log.
 *
 * `mongo` solo dice si está configurado y si responde: ni la URI, ni el host,
 * ni el nombre de la base salen por aquí (es un endpoint público).
 */
healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "catalii-backend",
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
    mongo: mongoHealth(),
  });
});
