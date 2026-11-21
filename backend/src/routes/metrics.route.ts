import { Router } from "express";
import { requireAuth, requireAdmin, requireAdminOrOwner, asyncHandler } from "@/middlewares/auth.js";
import { metricEventLimiter } from "@/middlewares/security.js";
import { metricsController } from "@/controllers/metrics.controller.js";

export const metricsRouter = Router();

/**
 * Escritura pública (beacon). Sin `validateBody` a propósito: este endpoint
 * responde 204 siempre, también con datos inválidos, así que la validación la
 * hace el controlador con `safeParse` y descarta en silencio.
 */
metricsRouter.post("/events", metricEventLimiter, metricsController.track);

// Lectura: panel de administración.
metricsRouter.get("/summary", requireAuth, requireAdmin, asyncHandler(metricsController.summary));

// Lectura: un negocio. Administrador o su dueño.
metricsRouter.get(
  "/business/:businessId",
  requireAuth,
  requireAdminOrOwner("businessId"),
  asyncHandler(metricsController.business),
);
