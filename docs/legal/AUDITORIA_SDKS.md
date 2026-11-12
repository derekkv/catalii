# Auditoría estática de SDKs, dominios y almacenamiento (orden 29) — Catalii

> **No es asesoría legal ni afirma cumplimiento.**
> **IMPORTANTE: la prueba real en la pestaña Red del navegador NO se hizo.** Este documento sale solo de leer código, `package.json`, configuración y el código distribuido de `@paddle/paddle-js`. Puede haber peticiones que el código no muestre (cargas dinámicas de los SDK, extensiones, el overlay de Paddle). Ver la sección 6 para hacer la prueba real.

Fecha del análisis: sesión actual · Alcance: `src/`, `next.config.ts`, `media-worker/wrangler.jsonc`, `open-next.config.ts`, `package.json`, `.env.example`. `backend/` no se analizó.

## 1. Dominios externos referenciados

Búsqueda de `https?://` en `src/`, `next.config.ts`, `wrangler.jsonc` y configuración.

| Dominio | Dónde | Tipo | ¿Petición automática del navegador? |
|---|---|---|---|
| `wa.me` | `src/app/c/[slug]/page.tsx` (≈177, 213), `storefront.tsx` (≈802-803), `dashboard/pedidos/orders-client.tsx` (≈255, 318), `dashboard/catalogos/[id]/share-card.tsx` (≈52), `catalog-card-actions.tsx` (≈29) | Enlaces `<a>` / `window.open` a WhatsApp (el número y el texto del pedido van en la URL) | **No**: solo al hacer clic. Al abrir se envían datos a WhatsApp/Meta (esos datos están en la URL) |
| `schema.org` | `src/app/c/[slug]/page.tsx:116` | `@context` de JSON-LD | No (es un identificador, no se descarga) |
| `catalii.com` | `src/lib/site.ts:24`, `media-worker/wrangler.jsonc:9` | URL propia (canónica / CORS) | Propio |
| `localhost:3000` | `site.ts`, `wrangler.jsonc` | Desarrollo | — |
| `*.supabase.co` (valor de `NEXT_PUBLIC_SUPABASE_URL`) | `.env.example:2`, `src/lib/supabase/*` | API/Auth de Supabase | Ver §2. El dominio real depende del `.env` (no está en el repo) |
| `cdn.paddle.com` | Dentro de `node_modules/@paddle/paddle-js` (`paddle/v2/paddle.js` y `paddle/paddle.js`); no aparece en `src/` | Script cargado por el SDK | **Sí**, al llamar `initializePaddle` (§2) |
| `media.catalii.com` (ejemplo en comentario) o el valor de `NEXT_PUBLIC_MEDIA_URL` | `src/lib/media/config.ts:115-121` | Imágenes de usuarios (Cloudflare R2 vía Worker) | **Sí** si se configura; si está vacío se sirven desde `/api/media` (mismo dominio) |
| **Cualquier dominio** (URL de imagen externa) | `src/app/dashboard/productos/product-form.tsx:177-194`; `src/lib/media/config.ts:154` (`image_url` se usa como `src`) | `<img src=…>` hacia un host que elige el mayorista | **Sí, y es el riesgo principal**: el navegador del **comprador** pide la imagen a un tercero arbitrario (revela su IP/User-Agent a ese host). No hay CSP ni `remotePatterns` que lo limite |

No se encontraron: `<iframe>`, `<script src=…>` externos, `next/script`, hojas de estilo externas, `<link rel="stylesheet">`, píxeles, ni referencias a Google Analytics, GTM, Meta Pixel, Hotjar, Sentry, Vercel Analytics o similares en `src/` ni en `package.json`. (Búsqueda por texto; no sustituye la prueba en Red.)

Fuentes: `next/font/google` (`src/app/layout.tsx:2`) **debería** descargar y servir las fuentes desde el propio dominio en el build, sin pedir a `fonts.googleapis.com` desde el navegador. **No se verificó con un build** (no hay `.next` con `.woff2` ni se ejecutó `next build`). Hay que comprobarlo en la prueba de Red.

## 2. SDKs de `package.json` que hacen red desde el navegador

| SDK (versión) | Dónde se usa en el navegador | Dominios | Datos |
|---|---|---|---|
| `@paddle/paddle-js` 1.4.2 | `src/app/dashboard/facturacion/pricing-client.tsx:6,47,53` (`initializePaddle`, `Checkout.open`) — solo en la pantalla de Facturación (usuarios con sesión) | `cdn.paddle.com` (verificado en el código del paquete). El overlay de pago usará otros dominios de Paddle (checkout, API) que **no figuran en el repo: por determinar con la prueba de Red** | Token de cliente, `priceId`, correo del cliente si se pasa `customer.email` (`pricing-client.tsx:55`), IP/dispositivo hacia Paddle |
| `@supabase/ssr` 0.7.0 / `@supabase/supabase-js` 2.58.0 (navegador) | Solo `src/app/auth/reset/reset-form.tsx:6` importa `lib/supabase/client.ts` (`createBrowserClient`): restablecer contraseña | Dominio de `NEXT_PUBLIC_SUPABASE_URL` (`*.supabase.co`, a confirmar con el `.env` real) | Token de recuperación, nueva contraseña |
| `@supabase/ssr` (servidor) | `lib/supabase/server.ts`, `middleware.ts`, server actions de login/dashboard | Mismo dominio, pero **desde el servidor**, no desde el navegador | Sesión, datos del negocio |
| `@paddle/paddle-node-sdk` 3.2.0 | Solo servidor (`account-actions.ts`, `api/webhook/route.ts`, `lib/paddle/*`) | API de Paddle desde el servidor | — |
| `fetch` propios | `src/lib/media/upload-client.ts:34,52` → `/api/uploads` (mismo dominio) | Propio | Imágenes subidas |

Otras dependencias de runtime sin red conocida: `papaparse`, `qrcode` (genera el QR localmente), `zod`, `clsx`, `tailwind-merge`, `lodash.throttle`, `lucide-react`.

Catálogo público (`/c/[slug]`): en el código no hay SDK de terceros; sí se pide la imagen de cada producto (§1) y el catálogo carga `/api/media/*` o `NEXT_PUBLIC_MEDIA_URL`.

## 3. Cookies

- **Solo cookies de sesión de Supabase** (`sb-…-auth-token`), creadas con `setAll` en `src/lib/supabase/middleware.ts:70-76` y `server.ts:23-…`. Solo tras iniciar sesión (según DIAGNOSTICO, orden 3).
- No hay `document.cookie` ni librería de cookies propia. Paddle puede crear cookies/almacenamiento propios en su dominio al abrir el checkout: **no verificado**.

## 4. localStorage / sessionStorage

| Clave | Contenido | Dónde | Quién la ve |
|---|---|---|---|
| `catalii-theme` | Theme elegido | `components/theme/theme-provider.tsx:28,37`, `theme-script.tsx:13` | Visitante o usuario |
| `catalii-buyer` | **Nombre, teléfono y correo del comprador** (si marca «recordar») | `src/app/c/[slug]/storefront.tsx:736,769,771` | Comprador en catálogos públicos |
| Clave del carrito (`storageKey`) | Productos y cantidades del carrito | `storefront.tsx:98,121` | Comprador |
| Clave de `dev-banner` (`STORAGE_KEY`) | Aviso de desarrollo descartado | `components/dev-banner.tsx:31,43` | Usuario del dashboard |

No hay `sessionStorage` ni IndexedDB en `src/` (búsqueda por texto). Ninguna de estas claves se envía a terceros por código; viven en el navegador.

## 5. Cabeceras (CSP)

`next.config.ts` define: `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control`, `Strict-Transport-Security`, `Permissions-Policy` (cámara, micrófono, geolocalización, topics desactivados).

**Actualización (posterior a este análisis): ya hay CSP.** Se añadió en `src/middleware.ts` con nonce por petición, y la política completa, sus decisiones y los huecos están en [`docs/seguridad/CSP.md`](../seguridad/CSP.md). Importante: se envía como `Content-Security-Policy-Report-Only`, así que **informa pero no bloquea** hasta que se compile con `CSP_MODE=enforce` (tarea #51 de `PENDIENTES.md`). Los dominios del overlay de Paddle siguen cubiertos por el comodín `https://*.paddle.com` a falta de la prueba de red de §6.

## 6. Prueba real en la pestaña Red — NO realizada. Cómo hacerla

1. Abrir una **ventana privada** (sin extensiones) en Chrome/Firefox; DevTools → **Network**; marcar «Disable cache» y «Preserve log».
2. Para cada pantalla, vaciar el registro, cargar la página **sin aceptar ni hacer nada** y esperar 10 s:
   - Landing (`/`), `/login`, un catálogo público (`/c/<slug>`, con productos con imagen propia y con «imagen externa»), `/auth/reset` y Facturación (`/dashboard/facturacion`, con sesión).
3. En Network, agrupar por dominio (columna **Domain**; en Chrome: clic derecho en la cabecera → Domain). Anotar cada dominio distinto del propio, su tipo (script, img, font, fetch) y si lleva cookies (pestaña Cookies de cada petición).
4. En Facturación pulsar un plan para abrir el checkout de Paddle (entorno **sandbox**) y anotar los dominios nuevos. Cerrar sin pagar.
5. En **Application → Storage**, revisar Cookies, Local Storage y Session Storage antes y después de interactuar (carrito, «recordar mis datos», cambio de theme).
6. Confirmar que **no** hay peticiones a `fonts.googleapis.com` / `fonts.gstatic.com` (fuentes autoalojadas) ni a analítica/publicidad.
7. Comparar con las tablas de §1-§4 y anotar diferencias en este archivo (fecha, navegador, quién lo hizo). Repetir cada vez que se añada un SDK o dependencia.

## 7. Hallazgos para decidir

- Imágenes por URL externa en catálogos públicos → fuga de IP del comprador a terceros arbitrarios y contenido mixto posible. **Mitigado en parte:** ahora solo se aceptan URLs `https` (sin credenciales embebidas) en `image_url`, `logo_url` y `banner_url`; el host sigue siendo libre, así que la fuga de IP persiste y debería mencionarse en la política de privacidad. La opción de proxificar o limitar dominios sigue abierta.
- **CSP: ya existe**, en modo Report-Only (ver §5 y `docs/seguridad/CSP.md`).
- Dominios de Paddle del checkout: pendientes de prueba real, necesarios para la sección de proveedores (orden 32).
- `catalii-buyer` guarda datos personales en `localStorage` (ver orden 3 del DIAGNOSTICO).
