# Inventario de datos, rastreo y proveedores — Catalii

> **No es asesoría legal.** Este documento solo describe lo que se ve en el código (Fase 1 de la guía «35 puntos antes de lanzar tu app»). No afirma que la app «cumpla» ni «sea legal». Donde no se puede saber leyendo el código escribo **PREGUNTAR AL DUEÑO**; donde hace falta criterio jurídico, **PREGUNTAR A ABOGADO**.

- Fecha de revisión: 2026-11-12
- Alcance: rama `main` local, árbol de trabajo en `/home/derek/Proyectos/catalii`. Solo lectura. `backend/` (servicio Express paralelo, sin seguir en profundidad, lo restaura/migra otra persona) no se analiza; ver §0.
- Referencias `archivo:línea` sobre el código actual.

## 0. Ficha del proyecto (contexto del prompt maestro)

| Campo | Valor |
|---|---|
| Nombre de la app | Catalii (`src/lib/site.ts:3-4`, dominio `catalii.com`) |
| Empresa / responsable (razón social, domicilio, ID fiscal) | **PREGUNTAR AL DUEÑO** (no aparece en ningún archivo del repo; el autor git es `derekkv`, no es un dato legal) |
| País de la empresa | **PREGUNTAR AL DUEÑO** (no se asume). Indicios no concluyentes: copy en español, `locale: "es_MX"` (`src/lib/site.ts:8`), precios en USD (`supabase/migrations/0001_init.sql`: `currency default 'USD'`), ejemplos con `+52` y `es-MX` (`onboarding-form.tsx:68`, `facturacion/page.tsx:71`), zona horaria de commits −0500 |
| Países de los usuarios | **PREGUNTAR AL DUEÑO** |
| ¿Menores? | NO SÉ. Producto B2B; en ningún formulario se pregunta la edad |
| Cobros / suscripciones | Sí, vía Paddle. Planes Gratis/Starter/Pro/Business en `src/lib/plans.ts:24-57` (nota: el plan «Gratis» también existe en el código) |
| Usuarios suben contenido | Sí: fotos de producto, logo y banner (R2) y textos públicos de catálogo (`src/app/api/uploads/route.ts`, `src/lib/validation.ts:28-54`) |
| IA generativa | **No encontrada** en el código (ver §6) |
| Stack | Next.js 16.3.1, React 19.2.8, Tailwind 4, Supabase (Postgres/Auth/RLS), Paddle, Cloudflare Workers + R2 vía OpenNext (`package.json`, `wrangler.jsonc`) |
| Servicio paralelo | `backend/` (Node + Express) — según `NOTAS-SEPARACION.md` habla con la misma Supabase; **no analizado**. Hay que revisarlo aparte antes de ponerlo en producción: añadiría logs, CORS, rate-limit y posiblemente otro proveedor de hosting |

### Correcciones al contexto recibido

- **El acceso NO es por magic link.** Es correo + contraseña (`src/app/login/auth-form.tsx:99-164`, `src/app/login/actions.ts:30` `signInWithPassword`, `:57` `signUp`) con correo de confirmación de Supabase y flujo de «restablecer contraseña» (`actions.ts:97-108`). No hay OTP/magic link ni OAuth.
- **Las fuentes NO son remotas, ni en ejecución ni en el build.** `src/app/layout.tsx` usa `next/font/local` con los `.woff2` versionados en `src/fonts/`; se sirven desde el propio dominio (`/_next/static/media/*.woff2`) y ni el navegador del visitante ni el build llaman a `fonts.googleapis.com`. Hasta la migración se usaba `next/font/google`, que descargaba las fuentes en el build (ver `src/fonts/README.md`).

---

## 1. Datos personales y datos del negocio

Leyenda «Plazo hoy»: **no definido** = no hay en el repo ninguna política, job programado ni columna de caducidad (búsqueda de `cron`, `retenci`, `expire`, `delete from … where created_at` sin resultados en `src/` ni `supabase/migrations/`).

| # | Dato | Titular | Dónde se pide / se origina (archivo:línea) | Finalidad (según código) | Obligatorio | Dónde se guarda | Plazo hoy |
|---|---|---|---|---|---|---|---|
| 1 | Correo electrónico | Mayorista (usuario) | `auth-form.tsx:143-144`, `login/actions.ts:47,57-64` | Cuenta, login, recuperación | Sí | Supabase Auth (`auth.users`); región del proyecto: **PREGUNTAR AL DUEÑO** | no definido |
| 2 | Contraseña | Mayorista | `auth-form.tsx:147-152`, `actions.ts:48,57-60` | Autenticación (mín. 8, máx. 72 `actions.ts:15`) | Sí | Supabase Auth (hash gestionado por Supabase; no pasa por tablas propias) | no definido |
| 3 | Nombre y apellido (`full_name`) | Mayorista | `auth-form.tsx:139-140`, `actions.ts:46,61` | Se guarda como metadata de usuario; **no encontré ningún uso posterior en `src/`** (solo se escribe) → candidato a minimización | No (opcional) | `auth.users.raw_user_meta_data` | no definido |
| 4 | Nombre del negocio, slug, tema | Mayorista / negocio (puede ser persona física) | `onboarding-form.tsx:28-58,80-103`, `onboarding/actions.ts:28-56`, `settings-form.tsx:40-56`; `0001_init.sql:14-30` (`business`) | Mostrar el negocio en catálogos públicos | Nombre sí | Postgres Supabase tabla `business` | no definido |
| 5 | WhatsApp del negocio | Mayorista | `onboarding-form.tsx:62-72`, `settings-form.tsx:51-52`; `0001_init.sql:20` | Que los compradores contacten (enlace `wa.me`) | No | `business.whatsapp`; copia pública en `catalog.whatsapp` (`0001:67`) | no definido |
| 6 | Correo de contacto del negocio | Mayorista | `onboarding-form.tsx:75-76` (por defecto el del login, `onboarding/actions.ts:30`), `settings-form.tsx:55-56`; `0001:21` | Contacto; además **se usa para vincular el cliente de Paddle con el negocio** (`paddle/process-webhook.ts:46-50`) | No | `business.email`. No se expone a `anon` (`0002_rls_and_rpc.sql`: no hay `grant … to anon` sobre `business`; README:133-134) | no definido |
| 7 | Logo, banner, fotos de producto | Mayorista (contenido propio; puede contener personas/marcas de terceros) | `api/uploads/route.ts:61-137`; `brand-image-upload.tsx`, `product-images-field.tsx`; claves en `business.logo_key/banner_key`, `catalog.*_key`, `product.images` (`0004_media.sql`) | Mostrar el catálogo | No | Cloudflare R2 (buckets `catalii-products/-logos/-banners`, `wrangler.jsonc:r2_buckets`). Acceso público por URL (`api/media/[...path]/route.ts:31-36` `public, max-age=31536000, immutable`). El navegador comprime y recorta en canvas (`lib/media/resize.ts`) — **no verificado** que elimine EXIF/GPS; **PREGUNTAR AL DUEÑO** | no definido (se borran si se descarta/desreferencia: `uploads/route.ts:147-182`, `catalogos/actions.ts:10,114`) |
| 8 | Productos, precios, SKU, stock, descripciones | Mayorista | `productos/product-form.tsx`, `validation.ts:28-40`; `0001:33-55` | Catálogo | — | Tabla `product` | no definido |
| 9 | **Nombre del comprador** | Tercero anónimo (comprador final del mayorista) | `storefront.tsx:893-901` (`c-name`, obligatorio), `validation.ts:85`, RPC `0002:123-125,145` | Identificar el pedido | **Sí** | `"order".customer_name` (`0001:115`) | no definido |
| 10 | **WhatsApp del comprador** | Comprador | `storefront.tsx:904-919` (obligatorio, 5–25 car.), `validation.ts:86`, `0002:126-128,146`, `0001:116` | Contactar al comprador | **Sí** | `"order".customer_whatsapp` | no definido |
| 11 | **Correo del comprador** | Comprador | `storefront.tsx:922-930` (opcional), `validation.ts:87`, `0002:147`, `0001:117` | Contacto opcional | No | `"order".customer_email` | no definido |
| 12 | **Notas del pedido** (texto libre; el propio placeholder invita a «Dirección de entrega, horario preferido…») | Comprador | `storefront.tsx:932-940`, `validation.ts:88`, `0002:148`, `0001:121` | Entrega / observaciones | No | `"order".notes`. Puede contener **dirección postal** aunque no haya un campo específico | no definido |
| 13 | Líneas del pedido (producto, cantidad, precio) | Comprador / mayorista | RPC `place_order` `0002:152-187`; `0001:132-142` | Pedido | — | `order_item` | no definido |
| 14 | Mensaje de WhatsApp (nombre + folio + líneas + total) | Comprador | `storefront.tsx:781-795`: el navegador construye una URL `wa.me/<número>?text=…` y el comprador pulsa para enviar | Aviso opcional al mayorista | No (acción del comprador) | Sale a WhatsApp/Meta cuando el comprador pulsa; no pasa por servidores propios | n/a |
| 15 | Datos del comprador **recordados en el navegador** (`catalii-buyer`: nombre, teléfono, correo) | Comprador | `storefront.tsx:733-739` (lectura), `:764` (escritura **tras enviar el pedido con éxito**, sin preguntar) | Comodidad: no reescribir en pedidos futuros (`storefront.tsx:728-731`) | No | `localStorage` del navegador del comprador. **No hay aviso ni opción de borrarlo** | hasta que el usuario borre el almacenamiento |
| 16 | Carrito (`catalii-cart:<slug>`: ids + cantidades) | Comprador | `storefront.tsx:66,95-121` | Mantener el carrito | No | `localStorage` | hasta que se vacíe/borre |
| 17 | Preferencia de tema (`catalii-theme`) | Cualquier visitante | `theme-provider.tsx:6,28,37`, `theme-script.tsx:13` | Apariencia | No | `localStorage` | persistente |
| 18 | Aviso «en desarrollo» descartado (`catalii-dev-notice-dismissed`) | Visitante (fuera de `/c/*`) | `components/dev-banner.tsx:8,17-18`; apagable con `NEXT_PUBLIC_SHOW_DEV_NOTICE=false` (`wrangler.jsonc`) | UX | No | `localStorage` | persistente |
| 19 | Cookies de sesión `sb-<ref>-auth-token(.n)` | Mayorista | `lib/supabase/middleware.ts:35-41,65-78`, `lib/supabase/server.ts:18-26` | Sesión | Sí (si inicia sesión) | Cookie en el navegador. Atajo: sin cookie de sesión no se hace ninguna llamada a Supabase en rutas públicas (`middleware.ts:57-63`) | La define Supabase (**PREGUNTAR AL DUEÑO**: caducidad configurada en el panel) |
| 20 | Cliente de Paddle (`customer_id`, **email**) | Mayorista | Webhook `api/webhook/route.ts`, `paddle/process-webhook.ts:39-64`; `0001:144-152` (`paddle_customer`) | Enlazar pagos con el negocio | — | Postgres. `business_id` se pone a `NULL` si se borra el negocio (`0001:146` `on delete set null`) → **el email de Paddle sobrevive al borrado del negocio** | no definido |
| 21 | Suscripción Paddle (id, estado, `price_id`, `product_id`, fecha de cambio programado) | Mayorista | `process-webhook.ts:66-93`; `0001:154-165` | Activar/desactivar plan | — | Postgres | no definido |
| 22 | Datos de pago (tarjeta, facturación, impuestos) | Mayorista | Los recoge el checkout de Paddle (`facturacion/pricing-client.tsx:36-47`, `variant: "one-page"`); **la app no los guarda** (solo recibe ids/estado por webhook) | Cobro | Sí para planes de pago | Paddle | Según Paddle (**PREGUNTAR A ABOGADO / revisar términos de Paddle**) |
| 23 | Ledger de webhooks (`event_id`, fecha) | — | `api/webhook/route.ts:29-44`; `0001:168-171` | Idempotencia | — | `processed_webhook` | **crece sin límite** |
| 24 | Logs de aplicación | Usuarios (según contenido) | `console.error` en `login/actions.ts:35,67` (mensaje de error de Supabase, sin correo), `uploads/route.ts:123`, `api/webhook/route.ts:48`, `middleware.ts:111-115`; `wrangler.jsonc: observability.enabled = true` | Diagnóstico | — | Cloudflare Workers Observability (retención: **PREGUNTAR AL DUEÑO**) | por Cloudflare |
| 25 | IP, User-Agent, cabeceras de cada visita | Todo visitante | Inherente al hosting (Cloudflare) y a Supabase; la app no los almacena (búsqueda de `x-forwarded`/`cf-connecting`/`userAgent` en `src/`: solo `robots.ts`) | Operación / seguridad | — | Cloudflare, Supabase | **PREGUNTAR AL DUEÑO** |
| 26 | Tabla `customer` (nombre, WhatsApp, correo, notas del mayorista sobre sus clientes) | Clientes del mayorista | `0001:98-108` | Prevista, **sin uso en el código**: no hay `from("customer")` en `src/` | — | Postgres (vacía salvo uso manual) | no definido |
| 27 | Tabla `price_list` | — | `0001:88-96` | Prevista (listas de precios por cliente), **sin uso en `src/`** | — | Postgres | — |

**Borrado en cascada existente** (única mecánica de borrado que hay): `business.owner_id → auth.users on delete cascade` (`0001:16`); `product/catalog/price_list/customer/"order" → business on delete cascade`; `order_item → "order" on delete cascade`. Es decir, **si alguien borra el usuario en Supabase Auth, se borran negocio, productos, catálogos y pedidos**, pero: (a) no hay en la app ninguna acción para hacerlo, (b) los archivos de R2 **no** se borran con la cascada, (c) `paddle_customer`/`paddle_subscription` quedan huérfanos (`on delete set null`), (d) Paddle conserva lo suyo. No hay UI ni endpoint de «descargar mis datos» (`grep` de `exportar|descargar|export` solo encuentra la importación CSV).

**Backups:** no hay configuración de backups en el repo. **PREGUNTAR AL DUEÑO** (plan de Supabase, PITR, retención).

## 2. Personas (de quién son los datos)

| Grupo | Datos | ¿Menores? | ¿Se pregunta la edad? | ¿Algo del producto atrae a menores? |
|---|---|---|---|---|
| Mayoristas / distribuidores (titulares de cuenta; personas físicas o empleados de una empresa) | Correo, nombre, contraseña, datos del negocio, imágenes, datos de pago (en Paddle) | NO SÉ; producto B2B («Para mayoristas y distribuidores», `page.tsx` hero). Nada en el código lo impide ni lo comprueba | **No.** Ni en registro (`auth-form.tsx:130-164`) ni en onboarding | No hay elementos de gamificación, juegos ni contenido dirigido a menores en el código. Los productos de los catálogos los define cada mayorista (**PREGUNTAR AL DUEÑO** si se prohíbe algún rubro) |
| Compradores del mayorista (anónimos, sin cuenta) | Nombre, WhatsApp, correo opcional, notas (posible dirección) y pedido | NO SÉ. Cualquiera con el enlace público puede enviar un pedido (RPC `place_order` concedida a `anon`, `0002:201`) | **No** | No |
| Terceros que aparecen en el contenido subido por el mayorista (fotos con personas, marcas, descripciones) | Variable | NO SÉ | — | — |

Observación para el abogado: el mayorista sube datos de **sus propios compradores** (nombre/teléfono) a Catalii a través del formulario público. Quién es «responsable» y quién «encargado» de esos datos es una **cuestión jurídica abierta → PREGUNTAR A ABOGADO** (el formulario del comprador hoy **no identifica** ni al mayorista como responsable ni a Catalii, y no enlaza ningún aviso).

## 3. SDKs y rastreo

Resultado de buscar en `package.json`, `src/`, `public/`, `media-worker/` scripts y dominios externos: **no hay analítica, publicidad, píxeles, chat, soporte ni monitorización de errores de terceros** (sin Google Analytics/Tag Manager, Meta Pixel, Sentry, Hotjar, Intercom, etc.). No hay banner de cookies ni gestor de consentimiento.

| Herramienta / recurso | Qué envía y a qué dominio | País de procesamiento | ¿Antes o después del consentimiento? | Notas / prueba pendiente |
|---|---|---|---|---|
| `@supabase/ssr` + `supabase-js` (cookies `sb-*`, llamadas a `NEXT_PUBLIC_SUPABASE_URL`) | Sesión, consultas y RPC (`place_order`) a `<proyecto>.supabase.co`; el navegador del comprador llama a Supabase a través de acciones de servidor (`order-actions.ts:42-50`), no directo | **PREGUNTAR AL DUEÑO** (región del proyecto) | Técnico/necesario; sin banner. Visitantes sin sesión: sin llamada desde el middleware (`middleware.ts:57-63`) | Comprobar en pestaña Red |
| `@paddle/paddle-js` 1.4.2 (`initializePaddle`, `pricing-client.tsx:30`) | Inicializa el checkout; el SDK carga su script desde la CDN de Paddle y abre un checkout (datos de pago, email) | Paddle: **PREGUNTAR A ABOGADO / revisar** | Solo se carga en `/dashboard/facturacion` (usuarios autenticados), no en la landing ni en catálogos | Verificar en Red qué dominios contacta (`cdn.paddle.com`, `*.paddle.com`); no medido |
| `@paddle/paddle-node-sdk` 3.2.0 (servidor) | API de Paddle con `PADDLE_API_KEY`; verificación de webhooks (`api/webhook/route.ts:22-24`) | Paddle | n/a (servidor) | |
| `next/font/local` (Fraunces, Archivo, JetBrains Mono — `layout.tsx`, archivos en `src/fonts/`) | Ninguna red: los `.woff2` están en el repo y se sirven desde el propio dominio | n/a | n/a | Verificado con `next build` + `next start`: el HTML solo referencia `/_next/static/media/*.woff2`; no hay `fonts.gstatic.com` |
| Cloudflare Workers / OpenNext (hosting) | Toda petición HTTP (IP, UA) | Global (red de Cloudflare); **PREGUNTAR AL DUEÑO** | Inevitable | `observability.enabled: true` |
| Cloudflare R2 (imágenes; `media-worker/` opcional) | Imágenes públicas servidas por `NEXT_PUBLIC_MEDIA_URL` o `/api/media/*` | **PREGUNTAR AL DUEÑO** (jurisdicción de los buckets) | Necesario | `media-worker/wrangler.jsonc` declara `ALLOWED_ORIGINS` |
| Enlaces salientes a `wa.me` (`storefront.tsx:794-795`, `c/[slug]/page.tsx:175,211`) | Solo al pulsar: número y texto del pedido a WhatsApp/Meta | EE. UU./global (**PREGUNTAR A ABOGADO**) | Acción explícita del usuario | |
| JSON-LD en catálogos (`c/[slug]/page.tsx:143-146`) | Script **inline propio** (datos estructurados), no un tercero | — | — | |
| `lucide-react`, `qrcode` (QR generado en el navegador, `share-card.tsx`), `papaparse` (CSV en servidor, `productos/actions.ts:4`) | Procesamiento local; **sin red** | — | — | |
| `localStorage` (`catalii-theme`, `catalii-cart:*`, `catalii-buyer`, `catalii-dev-notice-dismissed`) | Solo local, sin envío a servidor | — | Se escribe sin banner ni aviso | Ver §5 y diagnóstico 3/31 (**PREGUNTAR A ABOGADO** si es «estrictamente necesario») |
| Cabeceras de seguridad (`next.config.ts:4-17`) | n/a | — | — | Hay HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy. **No hay Content-Security-Policy** (no es requisito legal; mención técnica) |

## 4. Proveedores (encargados / terceros que reciben datos)

| Proveedor | Función | Qué recibe | País / región | ¿DPA aceptado? | ¿Entrena IA con los datos? |
|---|---|---|---|---|---|
| Supabase | Base de datos, Auth, correos de Auth (confirmación y recuperación; plantillas **no están en el repo**, se editan en el panel de Supabase) | Todo lo de §1 (cuentas, negocio, pedidos con datos de compradores) | **PREGUNTAR AL DUEÑO** | **PREGUNTAR AL DUEÑO** (no hay evidencia en el repo) | **PREGUNTAR AL DUEÑO** / revisar términos |
| Cloudflare (Workers, R2, observabilidad; build con OpenNext) | Hosting, almacenamiento de imágenes, logs | Tráfico HTTP, imágenes, logs | **PREGUNTAR AL DUEÑO** | **PREGUNTAR AL DUEÑO** | **PREGUNTAR AL DUEÑO** |
| Paddle | Cobros y suscripciones; correos de recibos | Email, datos de pago/facturación (en Paddle), ids de suscripción | **PREGUNTAR A ABOGADO** (el abogado debe confirmar su rol —p. ej., si actúa como vendedor/«merchant of record»— y las consecuencias fiscales) | **PREGUNTAR AL DUEÑO** | **PREGUNTAR AL DUEÑO** |
| Proveedor SMTP propio | No hay en el repo. El mensaje de error `login/actions.ts:82` menciona «configura un SMTP propio» → **PREGUNTAR AL DUEÑO** qué remitente usa Supabase en producción | Correo del usuario | **PREGUNTAR AL DUEÑO** | **PREGUNTAR AL DUEÑO** | — |
| WhatsApp / Meta | Solo cuando el usuario pulsa `wa.me` | Número y texto | — | No aplica (enlace del usuario) | **PREGUNTAR A ABOGADO** |
| Google Fonts | Solo en build | Ninguno de usuarios | — | No aplica | — |
| Hosting de `backend/` (Express) | **No decidido / no analizado** | — | — | — | — |

## 5. Consentimientos y aceptaciones

| Acción | Dónde | ¿Casilla? ¿Marcada? | ¿Se registra? | Retiro / prueba |
|---|---|---|---|---|
| Aceptar términos del servicio | Registro: texto «Al crear tu cuenta aceptas los términos del servicio.» `auth-form.tsx:159-161` | **No hay casilla.** Es una frase informativa **sin enlace** (no existe ninguna página de términos en `src/app/`) | **No.** No hay tabla de aceptaciones en `supabase/migrations/*` ni columna `terms_accepted_at`; `signUp` no envía versión (`login/actions.ts:57-64`) | No aplica |
| Política de privacidad | En ninguna pantalla | No existe página ni enlace (landing `page.tsx:570-579`, login, onboarding, formulario del comprador) | — | — |
| Aceptación al enviar un pedido (comprador) | `storefront.tsx:893-960` | Sin casilla ni aviso ni enlace de privacidad | No | — |
| Cookies / almacenamiento no esencial | No existe banner | — | No | — |
| Marketing | No hay captación de consentimiento de marketing ni envíos comerciales en el código | — | — | — |
| Checkout de suscripción | Lo gestiona el overlay de Paddle (`pricing-client.tsx:36-47`). Lo que muestre Paddle (términos, renovación) **no está en el repo** | **PREGUNTAR AL DUEÑO** (revisar el flujo real en sandbox) | Lo que registre Paddle | — |
| Aviso de renovación automática en la app | No existe (`facturacion/page.tsx`, `pricing-client.tsx`: «/mes» y «Mejorar a …» sin texto de renovación). Landing: «Puedes cambiar o cancelar cuando quieras.» `page.tsx` (sección Precios) | — | — | — |

## 6. Inteligencia artificial

| Pregunta | Resultado |
|---|---|
| ¿Contenido generado por IA? | **No encontrado.** Sin SDK de IA en `package.json` (no `openai`, `@anthropic-ai/*`, `ai`, `@google/*`, etc.) ni llamadas a APIs de IA en `src/`. Búsqueda por `openai|anthropic|gemini|llm|generative` sin coincidencias de código relevantes |
| ¿Dónde se muestra / etiqueta? | n/a |
| ¿El proveedor puede entrenar con datos? | n/a. **PREGUNTAR AL DUEÑO**: ¿se usó IA para generar imágenes, textos o la identidad visual (favicon, copy de la landing)? Eso afecta a licencias/etiquetado (guía punto 11) |

## 7. Recursos de terceros (para los puntos 11 y 23)

- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`: **parecen los del template `create-next-app`** y **no se referencian en `src/`** (búsqueda por nombre sin resultados). Candidatos a eliminar; si se conservan, requieren crédito.
- `src/app/favicon.ico`: origen **desconocido** → **PREGUNTAR AL DUEÑO**.
- Íconos: `lucide-react` 0.469.0 (ISC).
- Fuentes: Fraunces, Archivo, JetBrains Mono, **autoalojadas** con `next/font/local` desde `src/fonts/`. Las tres son SIL OFL 1.1 (leído en el `OFL.txt` de cada familia en `google/fonts`, ahora copiado a `src/fonts/OFL-*.txt`); detalle en `CREDITS.md`.
- Dependencias de producción directas: `@paddle/paddle-js` (Apache-2.0), `@paddle/paddle-node-sdk` (Apache-2.0), `@supabase/ssr`, `@supabase/supabase-js`, `clsx`, `lodash.throttle`, `next`, `papaparse`, `qrcode`, `react`, `react-dom`, `tailwind-merge`, `zod` (MIT), `lucide-react` (ISC). Salida de `npx license-checker --production --summary`: MIT 11 · Apache-2.0 2 · ISC 1 · UNLICENSED 1 (el propio paquete `catalii`, `private: true`). **Limitación:** `pnpm` no está disponible en esta sesión y `license-checker` solo resolvió el primer nivel (15 paquetes); las dependencias transitivas **no están verificadas**.
- No existe `LICENSE` en el repo ni archivo de créditos/avisos de terceros.
- Ejemplos de la landing: **ya no hay marcas reales**. Las maquetas, el placeholder del formulario y la plantilla CSV usan nombres genéricos («Refresco de cola 600 ml», «Galletas surtidas»). Antes decían «Coca-Cola 600 ml» y «Galleta María»; se sustituyeron (ver `PENDIENTES.md` #36).

## 8. Otras observaciones técnicas relevantes para el abogado (no son hallazgos de cumplimiento)

- Control de acceso: RLS activado en todas las tablas (`0002_rls_and_rpc.sql:1-11`); `anon` solo puede leer catálogos/productos públicos y ejecutar `place_order` (`0002:26-28,201`). `order` e `order_item` no son legibles por `anon`.
- `place_order` está concedido a `anon`. **Actualización:** la migración `0007` (escrita, **sin aplicar**) añade dentro del propio RPC un límite de frecuencia de 60 pedidos por catálogo y hora y 5 por teléfono cada 10 minutos. No guarda datos personales nuevos: cuenta las filas de `"order"` que ya existen. El RPC no recibe la IP, así que ese eje no se puede limitar desde SQL.
- `maxOrdersPerMonth` (20 en el plan Gratis, `plans.ts:29`). **Actualización:** la misma migración `0007` lo hace cumplir dentro de `place_order` (mes calendario en UTC; los pedidos cancelados no cuentan). Hasta aplicarla, sigue sin efecto.
- El botón «Cambiar a <plan>» para bajar de plan abría un **nuevo checkout**. **Actualización:** ya no; si hay una suscripción vigente se cambia el plan sobre ella (`paddle.subscriptions.update`) tras una confirmación, y existe «Cancelar suscripción». Sin probar contra Paddle.
- Existe un aviso «en desarrollo» (`dev-banner.tsx`) controlado por variable de entorno; `wrangler.jsonc` lo deja en `"false"`.
- Los valores de `wrangler.jsonc` (`vars`) son marcadores `REEMPLAZAR…`: la configuración real de producción **no está en el repo** y no la he consultado.

---

## 9. Preguntas para el dueño (necesito tu respuesta)

**Identidad y alcance**
1. ¿Cuál es la razón social, el domicilio, el número de identificación fiscal y el correo de contacto legal de la empresa (o eres persona física)? ¿En qué país está constituida?
2. ¿En qué países tienes o tendrás **mayoristas** y **compradores**? ¿Hay UE/EE. UU./California? ¿Solo México/LatAm?
3. ¿Aceptas que Catalii sea solo B2B (con una declaración de «uso solo para mayores de edad/empresas»), o puede haber minoristas o menores? ¿Quieres una edad mínima?
4. ¿Qué rubros están permitidos o prohibidos en los catálogos (alcohol, tabaco, medicamentos, adultos…)?

**Proveedores y regiones**
5. ¿En qué región está el proyecto de Supabase? ¿Qué plan (backups, PITR, retención de logs)? ¿Tienes aceptado su DPA?
6. ¿Qué remitente de correo usa Supabase en producción (SMTP propio o el predeterminado)? ¿Dónde están las plantillas de correo de confirmación y recuperación (no están en el repo) y qué dicen?
7. ¿Jurisdicción/ubicación de los buckets R2 y retención de la observabilidad de Cloudflare? ¿DPA de Cloudflare aceptado?
8. Paddle: ¿cuenta en producción o solo sandbox? ¿Quién es el vendedor ante el cliente final? ¿Impuestos incluidos en los precios `$19/$49/$99` o se añaden en el checkout? ¿El precio configurado en Paddle coincide con los precios fijos del código (`plans.ts:28,35,43,52`)? ¿Paddle ofrece casilla de marketing en tu checkout?
9. ¿Qué hosting tendrá `backend/` (Express) y se va a poner en producción? Hay que inventariarlo antes.

**Datos y retención**
10. ¿Cuánto tiempo quieres guardar: cuentas inactivas, pedidos, pedidos cancelados, datos de compradores, logs, `processed_webhook`? ¿Algún plazo fiscal/contable que te obligue a conservar facturas (se lo preguntaremos al abogado)?
11. ¿Quieres que el mayorista pueda **exportar y borrar** sus datos y los de sus compradores desde el panel? ¿Qué canal de contacto ofrecerás a quien no pueda entrar?
12. ¿Quieres seguir guardando en el navegador del comprador nombre/teléfono/correo (`catalii-buyer`) tras el pedido? ¿Prefieres hacerlo opcional («Recordar mis datos») o quitarlo?
13. ¿Los campos opcionales de WhatsApp del negocio y correo del comprador son realmente necesarios? ¿Para qué se usa el correo del comprador (hoy no se envía ningún correo desde el repo)?

**Contenido y marketing**
14. ¿Habrá correos comerciales o boletines? (hoy no hay código de envío). ¿Se enviarán correos transaccionales de pedidos desde Catalii?
15. ¿De dónde salen `favicon.ico`, el wordmark (`components/brand/wordmark.tsx`) y las imágenes/textos de la landing? ¿Algo generado con IA?
16. ¿Son ciertas las afirmaciones de la landing: «10 min», «24/7», «Gratis para siempre · Sin tarjeta», «Lo que escuchamos en cada bodega que visitamos», «Analytics», «Integración ERP», «API», «Marca blanca», «Multi-lista de precios», «Stock en tiempo real», «precios por cliente»? ¿Existen o están en el plan de producto?
17. ¿Quieres publicar un canal para reclamos de derechos de autor sobre el contenido que suben los mayoristas?
18. ¿Cómo quieres tratar «Cancelar suscripción»: autoservicio en la app (portal de Paddle) o por correo? ¿Hay período de prueba? ¿Política de reembolsos deseada?
19. ¿Hay clientes/casos reales que mencionar en la landing o seguirá sin logos ni testimonios?
