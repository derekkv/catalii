import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors.js";
import { env } from "@/config/env.js";

/** Para cualquier ruta que no exista. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "not_found", message: "Ruta no encontrada." } });
}

/**
 * Manejador de errores central. Debe ir al final (4 argumentos). Traduce
 * ApiError y ZodError a respuestas JSON consistentes; cualquier otra cosa es un
 * 500 y se registra. En producción no filtra detalles internos.
 *
 * El 4º argumento (`next`) es obligatorio: Express solo trata una función como
 * manejador de errores si declara cuatro parámetros, aunque no se use.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "bad_request",
        message: err.issues[0]?.message ?? "Datos inválidos.",
        issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }

  console.error("[error]", err);
  res.status(500).json({
    error: {
      code: "internal",
      message: "Error interno del servidor.",
      ...(env.isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
    },
  });
}
