import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { env } from "@/config/env.js";

/** CORS: solo los orígenes de CORS_ORIGINS. Permite peticiones sin Origin
 *  (curl, health checks) para no romper monitoreo. */
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
