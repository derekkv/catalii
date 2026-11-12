import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

/**
 * Valida y NORMALIZA `req.body` contra un esquema zod antes del controlador.
 * Si falla, pasa el ZodError al manejador central (que lo formatea). Así los
 * controladores reciben datos ya tipados y limpios, sin repetir safeParse.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    req.body = parsed.data;
    next();
  };
}
