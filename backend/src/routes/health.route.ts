import { Router } from "express";

export const healthRouter = Router();

/** Sonda simple para readiness/liveness y para comprobar que el server vive. */
healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "catalii-backend",
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});
