import "server-only";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

/**
 * Autorización del panel de administración.
 *
 * Decisiones:
 *
 *  · La lista de administradores vive en `ADMIN_EMAILS` (variable de entorno
 *    del servidor, correos separados por coma), no en la base de datos. Así no
 *    hay una tabla que un fallo de RLS pueda exponer o modificar, y conceder o
 *    quitar acceso es un cambio de configuración, no de datos.
 *
 *  · Es `server-only`. El panel consulta con el cliente de servicio, que salta
 *    RLS, así que esta comprobación es la ÚNICA barrera: no puede acabar en el
 *    navegador ni ejecutarse en un componente de cliente.
 *
 *  · La comparación es sobre el correo verificado por Supabase Auth
 *    (`getUser()` revalida el token contra Auth en cada petición), no sobre
 *    nada que venga del cliente.
 */

/** Correos con acceso al panel, normalizados. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** `true` si hay al menos un administrador configurado. */
export function adminConfigured(): boolean {
  return adminEmails().length > 0;
}

/** `true` si ese correo es administrador. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/**
 * Exige sesión de administrador. Devuelve el usuario.
 *
 * Si no hay sesión, manda a /login. Si hay sesión pero no es administrador,
 * responde 404 en vez de 403: un 403 confirmaría que /admin existe a cualquier
 * usuario que pruebe la ruta.
 */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");

  if (!isAdminEmail(user.email)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  return user;
}
