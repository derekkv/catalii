import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/*
 * Middleware: refresco de sesión de Supabase + Content-Security-Policy con
 * nonce por petición.
 *
 * Corre en el runtime Edge (workerd en producción, vía OpenNext), así que aquí
 * solo hay APIs web: `crypto`, `btoa`, `Headers`. Nada de `node:crypto`.
 *
 * Documentación de la política y cómo pasarla a modo bloqueo:
 * `docs/seguridad/CSP.md`.
 */

/**
 * Cabecera de petición con la que el nonce llega a los server components.
 * La leen `src/app/layout.tsx` (script de theme) y `src/app/c/[slug]/page.tsx`
 * (JSON-LD) con `headers()`. El literal está repetido en esos archivos a
 * propósito: importar este módulo desde un componente arrastraría
 * `next/server` y el cliente de Supabase al bundle de la página.
 */
const NONCE_HEADER = "x-nonce";

/**
 * Modo de la CSP.
 *
 * Por defecto **Report-Only**: el navegador informa de las violaciones pero no
 * bloquea nada, así que una directiva incompleta no puede tumbar el checkout
 * de pago ni el catálogo público. Para pasar a bloqueo, define
 * `CSP_MODE=enforce` en el entorno del build (es una variable de build: el
 * valor se incrusta al compilar el middleware) y vuelve a desplegar.
 *
 * Antes de activarlo, lee `docs/seguridad/CSP.md`: hay que observar las
 * violaciones reales, sobre todo las del overlay de Paddle, que no se pudo
 * probar sin cuenta.
 */
const ENFORCE_CSP = process.env.CSP_MODE === "enforce";
const CSP_HEADER = ENFORCE_CSP ? "content-security-policy" : "content-security-policy-report-only";

/**
 * Nonce aleatorio de 128 bits en base64, uno por petición.
 *
 * `crypto.getRandomValues` y `btoa` existen tanto en el runtime Edge como en
 * workerd. Se usa base64 porque es lo que admite el token `nonce-...` de CSP
 * sin escapes.
 */
function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Origen (`https://host[:puerto]`) de una URL de configuración, o null. */
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Política de seguridad de contenido.
 *
 * Decisiones y lo que queda sin verificar:
 *
 *  · `script-src`: solo scripts propios con el nonce de esta petición. Next
 *    pone el nonce en sus propios scripts leyendo esta misma cabecera del
 *    request (`app-render` extrae el `nonce-...`). `cdn.paddle.com` está
 *    confirmado leyendo `node_modules/@paddle/paddle-js` (carga
 *    `/paddle/v2/paddle.js`). El resto de subdominios de Paddle entran por
 *    comodín `*.paddle.com`: el overlay de pago se monta en tiempo de
 *    ejecución y sus dominios exactos (buy / checkout-service / sandbox-*) no
 *    están en el repo ni en la documentación pública, y no hay cuenta para
 *    comprobarlos (tarea #18). Cuando la prueba de Red los confirme, cambia el
 *    comodín por la lista exacta.
 *  · `style-src 'unsafe-inline'`: obligatorio. Hay atributos `style={{…}}` en
 *    componentes (p. ej. la altura de la cabecera del catálogo) y Next inyecta
 *    estilos en línea. Con nonce en `style-src`, el navegador IGNORA
 *    `'unsafe-inline'` y esos atributos quedarían bloqueados, así que aquí no
 *    va nonce. Tailwind se sirve como archivo propio, cubierto por `'self'`.
 *  · `img-src https:`: tras la tarea #23 las imágenes externas de producto ya
 *    solo pueden ser https, pero el host lo elige el mayorista, así que no hay
 *    lista posible. `blob:` es para las vistas previas al subir imágenes y
 *    `data:` para iconos embebidos. Cubre también `NEXT_PUBLIC_MEDIA_URL`.
 *  · `connect-src`: el propio origen (server actions, `/api/*`) y Supabase.
 *    Si algún día se usa Realtime habrá que añadir el `wss://` del mismo host.
 *  · `frame-src`: el overlay de Paddle es un iframe. Nada más se embebe.
 *  · `frame-ancestors 'none'`: la app no se embebe en ningún sitio. Es más
 *    estricto que el `X-Frame-Options: SAMEORIGIN` de `next.config.ts`, que se
 *    mantiene para navegadores sin CSP3.
 */
function buildCsp(nonce: string): string {
  const supabase = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const media = originOf(process.env.NEXT_PUBLIC_MEDIA_URL);
  const paddle = ["https://cdn.paddle.com", "https://*.paddle.com"];

  const directives: Record<string, (string | null)[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, ...paddle],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:", media],
    "font-src": ["'self'"],
    "connect-src": ["'self'", supabase, media, ...paddle],
    "frame-src": ["'self'", ...paddle],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => {
      const list = [...new Set(values.filter((v): v is string => Boolean(v)))];
      return `${name} ${list.join(" ")}`;
    })
    .join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp(nonce);

  // 1. Sesión: puede devolver un redirect a /login o una respuesta de paso.
  //    `updateSession` también reescribe la cookie del request cuando refresca
  //    el token, y eso queda en `request.headers` (RequestCookies escribe ahí).
  const sessionResponse = await updateSession(request);

  // 2. Redirect (u otra respuesta terminal): no se renderiza HTML, solo se
  //    etiqueta con la política y se devuelve tal cual.
  if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
    sessionResponse.headers.set(CSP_HEADER, csp);
    return sessionResponse;
  }

  // 3. Respuesta de paso: se reconstruye para poder inyectar cabeceras en el
  //    REQUEST. Se clonan después de `updateSession` para no perder la cookie
  //    ya refrescada. La CSP también va en el request porque Next lee de ahí
  //    el nonce para sus propios scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(CSP_HEADER, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Las cookies que puso el refresco de sesión viajan en la respuesta nueva.
  for (const cookie of sessionResponse.cookies.getAll()) response.cookies.set(cookie);
  response.headers.set(CSP_HEADER, csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/media/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
