import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withTimeout } from "@/lib/timeout";

/**
 * Refresca la sesión de Supabase en cada request y protege /dashboard.
 * Basado en el patrón oficial de @supabase/ssr para Next.js middleware.
 */

/**
 * Plazo máximo para verificar la sesión, en milisegundos.
 *
 * Sin plazo, si el servidor de Auth no responde, `auth-js` reintenta el
 * refresco con espera creciente y el middleware se queda esperando ~33 s. Y
 * como el matcher cubre casi todas las rutas, eso cuelga TAMBIÉN la landing y
 * los catálogos públicos, que no necesitan sesión para nada. En Cloudflare
 * Workers además agotaría los límites de CPU por request.
 *
 * Se acota la operación entera y no el `fetch`: el tiempo se va en las esperas
 * entre reintentos, así que abortar la petición de red no cambia nada.
 *
 * 4 s es holgado para un refresco de token (lo normal son decenas de ms).
 */
const AUTH_TIMEOUT_MS = 4000;

/**
 * ¿Trae el request una cookie de sesión de Supabase?
 *
 * Sirve para distinguir dos situaciones que `getUser()` reporta igual (sin
 * usuario) pero que significan cosas opuestas:
 *   · No hay cookie  → el visitante no ha iniciado sesión. Certeza.
 *   · Hay cookie pero la verificación falló → no lo sabemos (Auth caído,
 *     DNS roto, proyecto borrado…).
 *
 * `@supabase/ssr` nombra la cookie `sb-<ref>-auth-token`, y la parte en varias
 * (`.0`, `.1`) cuando el token no cabe. De ahí el match por prefijo/sufijo.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sin configuración de Supabase no bloqueamos la navegación pública.
  if (!url || !key) return supabaseResponse;

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/dashboard");

  // Atajo: sin cookie de sesión no hay nada que refrescar ni verificar, así
  // que las rutas públicas no pagan ni una llamada de red.
  if (!hasSessionCookie(request)) {
    if (!isProtected) return supabaseResponse;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: getUser() revalida el token contra el servidor de Auth.
  let user = null;
  let verificationFailed = false;

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_TIMEOUT_MS,
      "supabase.auth.getUser",
    );
    user = data.user;
    // `getUser()` no lanza ante fallos de red: devuelve un error de reintento.
    if (error) verificationFailed = true;
  } catch {
    // Fetch roto a nivel de runtime (DNS, TLS, abort por plazo).
    verificationFailed = true;
  }

  if (verificationFailed) {
    /*
     * No se pudo contactar con Supabase Auth.
     *
     * Deliberadamente NO redirigimos a /login. Un fallo de infraestructura no
     * es "esta persona no tiene sesión": expulsarla le haría creer que se
     * cerró su sesión y la dejaría en un login que tampoco funciona.
     *
     * Dejar pasar el request es seguro: cada página del panel vuelve a
     * verificar con `requireBusiness()` y los datos los protege RLS en
     * Postgres, igual de inalcanzable. No hay acceso posible a nada; lo que ve
     * el usuario es el límite de error con su botón de reintentar.
     */
    console.error(
      `[auth] No se pudo verificar la sesión contra ${url} en ${AUTH_TIMEOUT_MS} ms. ` +
        "¿El proyecto de Supabase existe y es alcanzable? " +
        "Comprueba NEXT_PUBLIC_SUPABASE_URL en .env.local.",
    );
    return supabaseResponse;
  }

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
