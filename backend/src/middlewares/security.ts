import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { env } from "@/config/env.js";

/** CORS: solo los orígenes de CORS_ORIGINS. Permite peticiones sin Origin
 *  (curl, health checks) para no romper monitoreo.
 *
 *  Nota sobre las métricas: el navegador NUNCA llama a este backend. El beacon
 *  va a `/api/metric` del Worker (mismo origen) y el Worker reenvía al backend
 *  desde el servidor, sin cabecera `Origin`. Lo mismo hacen las lecturas del
 *  panel (`backendFetch` corre en el servidor). Por eso `/api/metrics/*` NO
 *  necesita que se abra CORS, y `CORS_ORIGINS` en producción puede quedarse con
 *  los dominios del front como simple defensa en profundidad. */
const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
};

/** Middlewares base que se montan antes de las rutas. */
export function securityMiddlewares(): RequestHandler[] {
  return [
    helmet(),
    cors(corsOptions),
    morgan(env.isProd ? "combined" : "dev"),
  ];
}

/** Límite general para toda la API: frena abuso sin molestar al uso normal. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Demasiadas peticiones. Espera un momento." } },
});

/** Límite más estricto para enviar pedidos (endpoint público, sin sesión). */
export const placeOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Demasiados pedidos seguidos. Intenta más tarde." } },
});

/**
 * Límite de los eventos de métricas. Más estricto que `apiLimiter` en ritmo
 * (60 eventos cada 5 minutos por IP): un comprador real genera unos pocos por
 * visita, y quien pase de ahí es un bucle o un bot.
 *
 * Al pasarse del límite responde **204, no 429**: es un beacon, nadie lee la
 * respuesta, y así el endpoint se comporta siempre igual (el evento sobrante se
 * descarta sin escribir nada).
 */
export const metricEventLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.set("Cache-Control", "no-store").status(204).end();
  },
});
