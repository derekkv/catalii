# Content-Security-Policy de Catalii (tarea #21)

Qué hay implementado, por qué está en **Report-Only**, cómo pasarlo a bloqueo y
qué quedó sin verificar.

- Política y nonce: `src/middleware.ts`
- Cabeceras que no dependen de la petición: `next.config.ts`
- Scripts en línea que necesitan el nonce: `src/components/theme/theme-script.tsx`
  (anti-destello de theme) y `src/app/c/[slug]/page.tsx` (JSON-LD del catálogo)

## Cómo viaja el nonce

1. `src/middleware.ts` genera 16 bytes aleatorios con `crypto.getRandomValues`
   y los pasa a base64 (`btoa`). Un nonce por petición. Son APIs web: el
   middleware corre en Edge/workerd y no puede usar `node:crypto`.
2. El middleware escribe en el **request** dos cabeceras: `x-nonce` y la propia
   CSP. La segunda no es decorativa: Next lee
   `content-security-policy` o `content-security-policy-report-only` del request
   y de ahí saca el nonce para **sus** `<script>`
   (`next/dist/server/app-render/app-render.js`, `getScriptNonceFromHeader`).
   Sin eso, en modo bloqueo el navegador tiraría el bootstrap de React.
3. El middleware escribe la CSP en la **respuesta** (ahí la ve el navegador).
4. `src/app/layout.tsx` y `src/app/c/[slug]/page.tsx` leen `x-nonce` con
   `headers()` y lo ponen en el atributo `nonce` de sus scripts en línea.

El middleware primero delega en `updateSession` (refresco de sesión de
Supabase) y después reconstruye la respuesta de paso para poder inyectar las
cabeceras de request. Las cookies que haya puesto el refresco se copian a la
respuesta nueva, y las cabeceras del request se clonan **después** de
`updateSession` porque el refresco reescribe la cookie en el propio request.
Si `updateSession` devuelve un redirect (p. ej. `/dashboard` sin sesión), solo
se le añade la cabecera de CSP.

## La política

Tal como sale hoy en la respuesta (el nonce cambia en cada petición; los
dominios de Supabase y de medios salen de `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_MEDIA_URL`):

```
default-src 'self';
base-uri 'self';
object-src 'none';
form-action 'self';
frame-ancestors 'none';
script-src 'self' 'nonce-<aleatorio>' https://cdn.paddle.com https://*.paddle.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https: <NEXT_PUBLIC_MEDIA_URL>;
font-src 'self';
connect-src 'self' <NEXT_PUBLIC_SUPABASE_URL> <NEXT_PUBLIC_MEDIA_URL> https://cdn.paddle.com https://*.paddle.com;
frame-src 'self' https://cdn.paddle.com https://*.paddle.com;
worker-src 'self' blob:;
manifest-src 'self';
media-src 'self'
```

Por qué cada decisión discutible:

| Directiva | Motivo |
|---|---|
| `script-src` sin `'unsafe-inline'` | Los dos scripts en línea propios van con nonce; los de Next también (ver arriba). |
| `https://cdn.paddle.com` | Confirmado leyendo `node_modules/@paddle/paddle-js`: carga `/paddle/v2/paddle.js`. |
| `https://*.paddle.com` | **Sin confirmar.** El overlay de pago monta su iframe y sus llamadas en tiempo de ejecución, y esos subdominios (buy / checkout-service / sandbox-…) no aparecen en el repo ni en la documentación pública. Es la directiva más permisiva estrictamente necesaria: acota a Paddle, pero no a un subdominio. Cuando la tarea #18 (pestaña Red) los anote, sustituye el comodín por la lista exacta. Ojo: `*.paddle.com` **no** cubre `paddle.com` a secas. |
| `style-src 'unsafe-inline'` y sin nonce | Hay atributos `style={{…}}` en componentes (p. ej. `--catalog-header-h` en el catálogo) y Next inyecta estilos en línea. Si se añadiera un nonce a `style-src`, el navegador **ignora** `'unsafe-inline'` y esos atributos quedarían bloqueados. Tailwind se sirve como archivo propio (`'self'`). |
| `img-src https:` | Tras la tarea #23 una imagen externa solo puede ser `https`, pero el host lo elige el mayorista: no hay lista posible. `blob:` es para la vista previa al subir, `data:` para iconos embebidos. Si algún día se limita a dominios propios o a un proxy, esto se puede cerrar a `'self'` + el dominio de medios. |
| `font-src 'self'` | `next/font/google` autoaloja las fuentes. Verificado en el build: se sirven de `/_next/static/media/*.woff2` y la cabecera `Link: rel=preload` apunta al propio dominio. No hace falta `fonts.gstatic.com`. |
| `connect-src` | Propio origen (server actions, `/api/*`) + Supabase + Paddle. **Si se usa Realtime de Supabase habrá que añadir el `wss://` del mismo host.** |
| `frame-ancestors 'none'` | La app no se embebe en ningún sitio (no hay `<iframe>` propio). Es más estricto que el `X-Frame-Options: SAMEORIGIN` de `next.config.ts`, que se mantiene como red para navegadores viejos y porque en Report-Only `frame-ancestors` no bloquea. |
| Sin `report-uri` / `report-to` | No hay endpoint de recogida de violaciones. En Report-Only las violaciones salen solo por la consola del navegador. Si se quiere recoger, hace falta una ruta nueva (`/api/csp-report`), que no estaba en el alcance de esta tarea. |

## Está en Report-Only. Por qué

El middleware manda `Content-Security-Policy-Report-Only`, que informa pero no
bloquea. Razones:

1. **El checkout de Paddle no se pudo probar** (no hay cuenta ni navegador en
   este entorno; tareas #13 y #18 siguen abiertas). Los dominios del overlay
   son una suposición acotada. En bloqueo, un dominio que falte tumba el pago,
   que es lo único que factura.
2. Lo que de verdad protege de un XSS almacenado es que `script-src` no
   lleve `'unsafe-inline'`, y eso solo se activa en bloqueo. En Report-Only la
   política es **documentación y telemetría**, no defensa: cuenta como paso 1
   de la tarea #21, no como la tarea cerrada.

### Pasar a bloqueo

1. Despliega con Report-Only y navega con la consola abierta: landing, login,
   panel, catálogo público, subida de imágenes, y **el checkout de Paddle en
   sandbox de punta a punta** (la prueba de la #13).
2. Anota cada violación (`Refused to … because it violates …`). Si alguna
   viene de un dominio de Paddle, añádelo a `script-src`/`connect-src`/
   `frame-src` en `buildCsp` de `src/middleware.ts` y aprovecha para cambiar el
   comodín por la lista real.
3. Cuando no queden violaciones, compila y despliega con `CSP_MODE=enforce` en
   el entorno del build. La cabecera pasa a `Content-Security-Policy`.
4. Verificación rápida: `curl -sI https://TU-DOMINIO/ | grep -i content-security`
   y `curl -s https://TU-DOMINIO/ | grep -c 'nonce='` (debe haber un nonce en
   todos los `<script>` y coincidir con el de la cabecera).

Para volver atrás basta quitar `CSP_MODE` y volver a desplegar.

## Coste: renderizado dinámico

Un nonce por petición es incompatible con HTML cacheado: el HTML guardado
llevaría un nonce viejo que ya no coincide con el de la cabecera. Al leer
`headers()` en el layout raíz, **todas** las rutas pasan a renderizarse en cada
petición.

Medido con `next build` antes y después del cambio:

- Antes eran estáticas (`○`): `/`, `/login`, `/auth/reset`, `/contacto`,
  `/privacidad`, `/terminos`, `/reembolsos`, `/proveedores`,
  `/derechos-de-autor`, `/_not-found`.
- Después todas salen como dinámicas (`ƒ`).
- `/c/[slug]` y el panel **ya eran dinámicos antes**: `createClient()` usa
  `cookies()`, así que el `export const revalidate = 60` del catálogo público
  ya no tenía efecto (eso es anterior a esta tarea y merece su propia
  decisión; afecta a la #32).

Son páginas sin datos de usuario, así que el coste es CPU de Worker por visita,
no consultas extra a Supabase. Si pesa, hay dos salidas:

- **Dejar el layout estático**: quitar el nonce del script de theme y
  permitirlo por hash (`'sha256-…'`), que se puede calcular porque el código es
  determinista. El JSON-LD seguiría necesitando nonce (su contenido cambia por
  catálogo), así que `/c/[slug]` seguiría dinámico, pero ya lo era.
- **Renunciar al nonce** y aceptar `'unsafe-inline'` en `script-src`, que
  deja la directiva casi sin valor contra XSS. No recomendado.

## Lo que esta política NO cubre

- Las rutas excluidas del matcher del middleware (`_next/static`, `_next/image`,
  `favicon.ico`, `robots.txt`, `sitemap.xml`, `api/media/` y las imágenes por
  extensión) salen **sin** cabecera de CSP. Son recursos, no documentos HTML, y
  ya llevan `X-Content-Type-Options: nosniff` desde `next.config.ts`.
- Sin `report-uri`: nadie recoge las violaciones por ahora.
- El overlay de Paddle tiene su propia CSP dentro de su iframe; lo que ocurra
  ahí dentro (3-D Secure, Apple Pay) no lo gobierna esta política.
