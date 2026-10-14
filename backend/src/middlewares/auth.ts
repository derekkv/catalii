import type { Request, Response, NextFunction, RequestHandler } from "express";
import { userClient } from "@/lib/supabase.js";
import { ApiError } from "@/lib/errors.js";
import type { Business } from "@/types/database.js";

/** Envuelve un handler async para que los throws lleguen al manejador central. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Exige un access token válido de Supabase. Revalida el token contra Auth (no
 * confía en el JWT a ciegas) y cuelga `req.auth` con un cliente que respeta RLS.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = bearer(req.headers.authorization);
    if (!token) throw ApiError.unauthorized("Falta el token de sesión.");

    const supabase = userClient(token);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw ApiError.unauthorized("Sesión inválida o expirada.");

    req.auth = { userId: data.user.id, token, supabase };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Además de la sesión, exige que el usuario tenga un negocio creado. Lo deja en
 * `req.business`. Para rutas del panel (productos, catálogos, pedidos).
 */
export async function requireBusiness(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw ApiError.unauthorized();
    const { data, error } = await req.auth.supabase
      .from("business")
      .select("*")
      .eq("owner_id", req.auth.userId)
      .maybeSingle();

    if (error) throw new ApiError(502, "No se pudo cargar el negocio.", "db_error");
    if (!data) throw ApiError.forbidden("Primero crea tu negocio (onboarding).");

    req.business = data as Business;
    next();
  } catch (err) {
    next(err);
  }
}
