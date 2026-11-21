import type { Request, Response, NextFunction, RequestHandler } from "express";
import { userClient } from "@/lib/supabase.js";
import { ApiError } from "@/lib/errors.js";
import { env } from "@/config/env.js";
import type { Business } from "@/types/database.js";

/** Formato de uuid, para no consultar con un id imposible. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    req.auth = { userId: data.user.id, email: data.user.email ?? null, token, supabase };
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

/* -------------------------------------------------------------------------- */
/* Administración                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Error que se usa cuando alguien con sesión no tiene permiso en las rutas de
 * administración: **404, no 403**, con el mismo cuerpo que una ruta inexistente
 * (ver middlewares/error.ts). Un 403 confirmaría que la ruta existe a cualquiera
 * que la pruebe. El panel del front hace lo mismo (src/lib/admin.ts).
 */
function hidden(): ApiError {
  return ApiError.notFound("Ruta no encontrada.");
}

/** `true` si ese correo está en ADMIN_EMAILS. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.adminEmails.includes(email.trim().toLowerCase());
}

/**
 * Exige administrador. Va SIEMPRE después de `requireAuth`, porque compara el
 * correo que Supabase Auth acaba de verificar, no nada que venga del cliente.
 *
 * La lista vive en `ADMIN_EMAILS` (entorno) y no en la base de datos: así no
 * hay una tabla que un fallo de RLS pueda exponer o modificar, y dar o quitar
 * acceso es un cambio de configuración. Si la lista está vacía, nadie pasa.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(ApiError.unauthorized());
  if (!isAdminEmail(req.auth.email)) return next(hidden());
  next();
}

/**
 * Administrador **o** dueño del negocio que viaja en la ruta.
 *
 * La propiedad se comprueba con el cliente del usuario, que respeta RLS, y
 * además se filtra por `owner_id`: la política pública de `business` deja a
 * cualquier usuario leer los negocios publicados, así que ver la fila no
 * demuestra ser el dueño.
 */
export function requireAdminOrOwner(param = "businessId") {
  return async function (req: Request, _res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw ApiError.unauthorized();
      if (isAdminEmail(req.auth.email)) return next();

      const businessId = req.params[param];
      // Un id que no es uuid no llega a consultarse: Postgres daría un error de
      // tipo y aquí basta con tratarlo como "no existe".
      if (!businessId || !UUID_RE.test(businessId)) throw hidden();

      const { data, error } = await req.auth.supabase
        .from("business")
        .select("id")
        .eq("id", businessId)
        .eq("owner_id", req.auth.userId)
        .maybeSingle();

      if (error) throw new ApiError(502, "No se pudo verificar el negocio.", "db_error");
      if (!data) throw hidden();

      next();
    } catch (err) {
      next(err);
    }
  };
}
