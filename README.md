# Catalii — Catálogos digitales para mayoristas

MVP funcional de una plataforma SaaS multi-tenant donde un mayorista sube sus
productos y obtiene un **catálogo público** con búsqueda, filtros, carrito y
**pedidos sin login**. Incluye panel de gestión, **themes configurables**,
facturación con **Paddle** y base de datos en **Supabase** con RLS.

## Stack

- **Next.js 16** (App Router, React 19) + **TypeScript**
- **Tailwind CSS 4** — sistema de tokens por theme + escala tipográfica (`data-theme`)
- **Supabase** — Postgres + Auth (correo y contraseña) + RLS multi-tenant
- **Paddle** — checkout, webhooks firmados y sincronización de suscripciones
- **zod** para validación, **papaparse** (import CSV), **qrcode** (QR de compartir)

## Organización (front / back / supabase)

> **Trabajo pendiente: [`PENDIENTES.md`](./PENDIENTES.md)** — lista única y
> numerada de lo que falta (datos legales, migraciones sin aplicar,
> verificaciones, seguridad, despliegue). Empieza por ahí.
>
> **Cómo encaja todo: [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md)** —
> diagramas del sistema, de los flujos (pedido, cobro, métricas), del modelo de
> datos y del despliegue. Para pizarra:
> [`docs/ARQUITECTURA-EXCALIDRAW.md`](./docs/ARQUITECTURA-EXCALIDRAW.md).

El repo está separado en tres partes:

```
.
├── src/            # FRONT  → app Next.js (web + panel + catálogo público)
├── backend/        # BACK   → API Node.js + Express (ver backend/README.md)
├── supabase/       # DB     → migraciones, RLS y RPC (ver supabase/README.md)
├── media-worker/   # Worker aparte que sirve las imágenes de R2
├── scripts/        # utilidades (export-legal.ts)
└── docs/           # marca (docs/brand/), legal (docs/legal/) y la API de métricas
```

- **Front (`src/`)** — la app Next.js desplegada en Cloudflare Workers. Hoy su
  lógica de servidor vive en Server Actions y Route Handlers.
- **Back (`backend/`)** — un servicio Express independiente que habla con la
  **misma** Supabase respetando RLS. El front ya lo consume (ver abajo).
- **Supabase (`supabase/`)** — única fuente de verdad de los datos; la usan
  tanto el front como el back.

### El front consume el back (`BACKEND_URL`)

`src/lib/backend.ts` es el cliente HTTP (solo servidor): toma el access token de
la sesión de Supabase y lo manda como `Authorization: Bearer`; el backend lo
revalida contra Auth en cada petición.

- **`BACKEND_URL` vacía** → todo sigue como antes (Supabase directo). Es el
  valor seguro mientras el backend no esté desplegado.
- **`BACKEND_URL` definida** → pasan por la API: enviar pedido (público),
  listar y cambiar estado de pedidos, y crear/editar/borrar productos y
  catálogos (incluido el gating por plan).
- Siguen directos a Supabase (aún sin endpoint en el back): importar CSV,
  imágenes de catálogo, sincronizar productos de un catálogo, lecturas de
  productos/catálogos/catálogo público, onboarding, ajustes y facturación.
- Las imágenes (R2) siguen siendo del front: sube y valida las claves, y limpia
  el bucket con las claves que devuelven los `DELETE` del backend.

```bash
pnpm backend:dev          # http://localhost:8787
# en .env.local del front:
BACKEND_URL=http://localhost:8787
# en backend/.env: CORS_ORIGINS=http://localhost:3000
```

> `backend/` está excluido de `tsconfig.json` y de ESLint del front (usa su
> propio alias `@/*`). Sin esa exclusión `next build` falla al tipar el backend.

### Las métricas ya no están en Postgres

Las visitas y los clics son **eventos en MongoDB** servidos por el backend
(`back.catalii.com`). El contrato está en `docs/METRICAS-API.md` y la migración
`0010` retira de Supabase la tabla de contadores, su enum y su RPC.

- El navegador manda el evento con `navigator.sendBeacon` a
  `POST /api/metric` (mismo origen: sin CORS y sin tocar la CSP). Esa ruta
  responde **204 siempre** y reenvía el evento al backend en segundo plano
  (`waitUntil`), así que el comprador nunca espera por la analítica. El Worker
  añade el país (`CF-IPCountry`), el host del referrer y `mobile`/`desktop`.
- El panel lee `/api/metrics/summary` y `/api/metrics/business/:id` con el
  access token del administrador que está viendo la pantalla
  (`src/lib/metrics/api.ts`). Si el backend no responde, **avisa de que las
  métricas no están disponibles en vez de mostrar ceros**, y el resto del panel
  (negocios, pedidos, suscripciones, que siguen en Postgres) funciona igual.
- Se guarda el evento sin IP, sin user agent, sin cookies y sin identificador
  de visitante, así que **no hay visitantes únicos**: cinco visitas pueden ser
  cinco personas o una recargando. El panel lo dice en cada pantalla.
- URL del backend de métricas: `METRICS_API_URL` si está definida, y si no
  `BACKEND_URL`. La variable aparte permite activar las métricas sin pasar
  también pedidos y productos por el backend.

## Estructura

```
src/
  app/
    page.tsx                # Landing de marketing
    login/                  # Acceso: correo y contraseña
    auth/confirm/ auth/reset/   # Enlaces de email: verificación y recuperación
    c/[slug]/               # Catálogo PÚBLICO (comprador) + SEO + JSON-LD
    dashboard/              # Panel del mayorista (protegido)
      onboarding/           # Crear negocio
      productos/            # CRUD + import CSV
      pedidos/              # Gestión de pedidos
      catalogos/[id]/       # Config, theme, selección de productos, QR
      facturacion/          # Planes + checkout Paddle
      configuracion/        # Datos del negocio + exportar/borrar cuenta
    privacidad/ terminos/    # Páginas legales (3, generadas
    contacto/                # desde src/lib/legal/)
    api/webhook/            # Webhook de Paddle (firma verificada)
    api/metric/             # Beacon de visitas y clics (204 siempre; reenvía al back)
    api/uploads/            # Subida y descarte de imágenes a R2
    api/media/[...path]/    # Servir imágenes (fallback sin media-worker)
    api/account/export/     # Descargar mis datos (JSON)
    sitemap.ts, robots.ts   # SEO
  components/
    ui/ theme/ dashboard/ media/   # UI, themes, panel, subida de imágenes
    legal/                  # Página y enlaces legales reutilizables
    brand/                  # brand-logo.tsx (símbolo + wordmark) y wordmark.tsx
  lib/
    supabase/               # clients: client / server / server-internal +
                            # middleware.ts (updateSession, lo llama src/middleware.ts)
    paddle/                 # instancia, webhook, customer id, suscripción
    actions/                # server actions (auth, pedidos)
    legal/                  # config.ts (datos), content.ts (texto), acceptance.ts
    media/                  # claves, resize en cliente, subida y helpers R2
    metrics/                # track.ts (beacon), api.ts (cliente del back), types.ts
    backend.ts              # cliente HTTP del backend Express (BACKEND_URL)
    themes.ts plans.ts validation.ts utils.ts site.ts auth.ts timeout.ts
  types/database.ts         # tipos de las tablas de Supabase
  middleware.ts             # Sesión Supabase + protección de /dashboard
scripts/export-legal.ts     # genera docs/legal/textos/ (pnpm legal:export)
supabase/migrations/        # 0001_init.sql · 0002_rls_and_rpc.sql
                            # 0003_default_theme_acero.sql · 0004_media.sql
                            # 0005_legal_acceptance.sql
                            # 0006_purge_processed_webhooks.sql
                            # 0007_order_limits_and_indexes.sql
                            # 0008_sync_catalog_products.sql
                            # 0009_business_pages_and_metrics.sql
                            # 0010_drop_postgres_metrics.sql
```

> `0005`–`0010` están escritas pero **sin aplicar** (ver `PENDIENTES.md`
> #9, #10, #12, #22, #29, #30 y #56). La `0010` retira las métricas de
> Postgres: el código del front ya está escrito contra MongoDB, así que esa
> tabla no se usa ni aunque exista.

## Puesta en marcha

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (Supabase) y las claves de Paddle.

### 3. Base de datos (Supabase)

Aplica las migraciones en orden (hay ocho: `0001` … `0008`). Con la CLI de
Supabase:

```bash
supabase link --project-ref TU_REF
supabase db push          # aplica supabase/migrations/*.sql
```

O bien pega el contenido de cada archivo de `supabase/migrations/` en **SQL
Editor** del panel de Supabase, en orden numérico (`0001_init.sql`,
`0002_rls_and_rpc.sql`, `0003_default_theme_acero.sql`, `0004_media.sql`,
`0005_legal_acceptance.sql`, `0006_purge_processed_webhooks.sql`,
`0007_order_limits_and_indexes.sql`, `0008_sync_catalog_products.sql`).

En **Authentication → URL Configuration** pon tu Site URL (p. ej.
`http://localhost:3000`) y agrega `/auth/confirm` a las redirect URLs.

### 4. Paddle

1. Crea productos y precios (plan Starter/Pro/Business) en el **sandbox**.
2. Copia los `pri_...` y `pro_...` a `.env.local`.
3. Crea un **notification destination** apuntando a `/api/webhook` con eventos
   `customer.created/updated`, `subscription.created/updated/canceled`; copia el
   secreto a `PADDLE_NOTIFICATION_WEBHOOK_SECRET`.

### 5. Desarrollo

```bash
pnpm dev      # http://localhost:3000
pnpm build    # build de producción
pnpm lint
```

## Flujos principales

- **Mayorista:** login → onboarding → cargar productos (manual o CSV) → crear
  catálogo, elegir theme y publicar → compartir link/QR por WhatsApp.
- **Comprador:** abre el link (sin cuenta) → busca/filtra → arma carrito →
  envía pedido (nombre + WhatsApp) → puede reenviarlo por WhatsApp al mayorista.
- **Pagos:** el mayorista mejora su plan desde *Facturación* (checkout Paddle);
  el webhook actualiza `plan` y la app aplica los límites.

## Formato del CSV de productos

Encabezados aceptados (flexibles, en español/inglés):

```
name,sku,price,stock,category,description,image_url
Refresco de cola 600 ml,RC600,12.50,240,Bebidas,Retornable,https://...
```

## Seguridad (decisiones clave)

- **RLS en todas las tablas.** Cada negocio pertenece a `owner_id = auth.uid()`.
  Las políticas usan predicados de propiedad (no sólo `TO authenticated`).
- **Datos públicos aislados.** El branding público vive en `catalog`; la tabla
  `business` (email, plan, owner) **no** se expone a `anon`.
- **Pedidos vía RPC `place_order` (SECURITY DEFINER).** Recalcula los precios
  desde la BD: el cliente nunca fija el precio. Valida catálogo público, saneo
  de entrada y crea pedido + líneas de forma atómica.
- **Service role sólo en servidor** (`server-internal.ts`, marcado `server-only`).
  El webhook lo usa; jamás llega al navegador.
- **Webhook de Paddle** verifica firma (`paddle.webhooks.unmarshal`) con el raw
  body, es **idempotente** (ledger `processed_webhook`) y responde no-2xx ante
  fallos para que Paddle reintente.
- **Cabeceras de seguridad** (HSTS, nosniff, X-Frame-Options, Permissions-Policy)
  en `next.config.ts`. `poweredByHeader` desactivado.
- **Validación con zod** en cada server action y en el RPC.

## Themes

La dirección visual es **papel de imprenta comercial**: tinta sobre papel sin
estucar, reglas de pelo en lugar de sombras difusas, radios pequeños y cifras
monoespaciadas. Tipografía: **Fraunces** (display), **Archivo** (interfaz) y
**JetBrains Mono** (precios, SKU y micro-etiquetas).

5 themes, uno por tipo de mayorista, definidos como variables CSS en
`globals.css` bajo `[data-theme]`:

| Theme | Para | Rasgo |
|---|---|---|
| `press` | Abarrotes, bebidas, distribución | Papel cálido + tinta vermellón (por defecto) |
| `noche` | Catálogos con mucha foto | Espresso oscuro + vermellón encendido |
| `mercado` | Frutas, verduras, agro | Verde botánico profundo |
| `acero` | Ferretería, refacciones | Azul industrial, radio 2 px |
| `hueso` | Perfumería, joyería, textil | Tinta negra y oro apagado, radio 0 |

Cada theme cambia paleta, radio y temperatura del papel, así que elegirlo es
una decisión de rubro y no de gusto cromático. El usuario elige el theme de la
app (persistido en `localStorage`) y cada catálogo puede tener el suyo (o
heredar el del negocio).

`resolveTheme()` traduce los ids del sistema anterior (`vibrant`, `coral`,
`ocean`, `midnight`, `luxe`, `swiss`) al equivalente más cercano, para que los
catálogos ya creados no cambien de aspecto solos.

### Escala tipográfica

La jerarquía vive en utilidades `.t-*` en `globals.css` (`t-display`, `t-h1`,
`t-h2`, `t-h3`, `t-lead`, `t-body`, `t-small`, `t-label`, `t-eyebrow`, `t-num`,
`t-price`) en lugar de combinarse a mano en cada archivo. Si hay que ajustar un
nivel, se ajusta en un sitio.

## Notas

- Las imágenes de productos, logos y banners se suben a **Cloudflare R2** (ver
  "Imágenes en R2" más abajo). Las URLs externas (`image_url` del CSV) siguen
  funcionando como respaldo.
- Para probar webhooks en local, expón el puerto con `ngrok http 3000` y usa esa
  URL en el notification destination de Paddle.


## Despliegue en Cloudflare Workers

La app está adaptada para **Cloudflare Workers** con el adaptador oficial
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (soporta App
Router, Server Actions, Route Handlers y middleware en Edge).

### Archivos relevantes
- `wrangler.jsonc` — configuración del Worker (assets, `nodejs_compat`).
- `open-next.config.ts` — configuración del adaptador (ISR opcional vía R2).
- `next.config.ts` — llama a `initOpenNextCloudflareForDev()` para bindings en dev.
- Middleware en `src/middleware.ts` (Edge). En Next 16 `proxy.ts` corre en Node,
  que **OpenNext aún no soporta**, por eso usamos `middleware.ts`.

### Scripts
```bash
pnpm cf:build      # next build + transforma a Worker (.open-next/)
pnpm cf:preview    # build + previsualiza local con workerd (usa .dev.vars)
pnpm cf:deploy     # build + despliega a Cloudflare (requiere wrangler login)
pnpm cf:typegen    # genera tipos de los bindings (cloudflare-env.d.ts)
```

> Si `pnpm` avisa `ERR_PNPM_IGNORED_BUILDS`, ejecuta una vez:
> `pnpm approve-builds --all` (compila los binarios de esbuild/workerd).

### Variables de entorno: build vs runtime
- **`NEXT_PUBLIC_*` → BUILD.** Se inyectan (inline) durante `pnpm cf:build`.
  Deben existir como variables de entorno del build (localmente se leen de
  `.env.local`; en CI, configúralas en el entorno de build).
- **Secretos de runtime** (`SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_API_KEY`,
  `PADDLE_NOTIFICATION_WEBHOOK_SECRET`, `PADDLE_PRODUCT_*`) → se cargan como
  **secrets del Worker** (no se inyectan en el bundle):
  ```bash
  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  npx wrangler secret put PADDLE_API_KEY
  npx wrangler secret put PADDLE_NOTIFICATION_WEBHOOK_SECRET
  npx wrangler secret put PADDLE_PRODUCT_STARTER
  npx wrangler secret put PADDLE_PRODUCT_PRO
  npx wrangler secret put PADDLE_PRODUCT_BUSINESS
  ```
  Para `pnpm cf:preview` en local, ponlos en `.dev.vars` (no versionado; no hay
  plantilla en el repo).

### Pasos para desplegar
```bash
# 1. Autenticar wrangler (abre el navegador)
npx wrangler login

# 2. Definir las NEXT_PUBLIC_* de producción en .env.local
#    (NEXT_PUBLIC_SITE_URL=https://catalii.com, claves de Supabase/Paddle, etc.)

# 3. Cargar los secretos de runtime (comandos de arriba)

# 4. Build + deploy
pnpm cf:deploy
```

Tras el primer deploy tendrás una URL `*.workers.dev` (o tu dominio si lo
conectas en el dashboard de Cloudflare). Luego:
- Apunta el **webhook de Paddle** a `https://TU-DOMINIO/api/webhook`.
- Agrega `https://TU-DOMINIO/auth/confirm` y `/auth/reset` a las **Redirect URLs**
  de Supabase, y pon el **Site URL** en Supabase.

### Notas
- **Despliegue continuo (Git):** en el dashboard de Cloudflare Workers puedes
  conectar el repo y usar como comando de build `pnpm cf:build` y directorio de
  salida el que genera OpenNext. Configura ahí las `NEXT_PUBLIC_*` (build) y los
  secretos (runtime).
- **ISR/caché** (`revalidate` en `/c/[slug]` y `sitemap`): **ya está habilitado**
  con R2 + Durable Object (ver la sección "ISR con R2" más abajo). Solo debes
  crear el bucket R2 una vez antes de desplegar.
- El bundle del Worker pesaba ~1.8 MB gzip en el último build medido (dentro
  del límite de Workers); vuelve a comprobarlo tras cambios grandes.


## ISR con R2 (habilitado) + Despliegue continuo desde Git

### ISR / caché incremental (ya configurado)
El catálogo público (`/c/[slug]`) y el `sitemap` usan `revalidate`. El proyecto
ya trae la caché incremental activada en `open-next.config.ts`:
- `incrementalCache: r2IncrementalCache` → páginas cacheadas en un bucket **R2**
  (binding `NEXT_INC_CACHE_R2_BUCKET`).
- `queue: doQueue` → revalidación en background con un **Durable Object**
  (`NEXT_CACHE_DO_QUEUE`, clase `DOQueueHandler`, SQLite, free-tier).

**Antes del primer deploy, crea el bucket R2** (una sola vez):
```bash
npx wrangler r2 bucket create catalii-cache
```
El Durable Object y su migración (`new_sqlite_classes`) se aplican solos al
desplegar. Resultado: los catálogos se sirven desde caché y se regeneran cada
60 s sin bloquear la respuesta.

> ¿No quieres ISR aún? Comenta `incrementalCache`/`queue` en
> `open-next.config.ts` y quita `r2_buckets`/`durable_objects`/`migrations` de
> `wrangler.jsonc`.

### Despliegue continuo (Cloudflare Workers Builds + Git)
1. Sube el repo a GitHub/GitLab (`git push`).
2. En el dashboard de Cloudflare: **Workers & Pages → Create → Workers →
   Connect to Git**, elige el repo.
3. Configura el build:
   - **Build command:** `pnpm cf:build`
     ⚠️ Cloudflare suele pre-rellenarlo con `next build` / `npm run build`.
     **Debes cambiarlo a `pnpm cf:build`**, si no, no se genera `.open-next/` y
     el deploy falla con *"Could not find compiled Open Next config"*.
   - **Deploy command:** `npx opennextjs-cloudflare deploy`
     (usa el `.open-next/` del build; equivale a `wrangler deploy` pero sin doble build)
   - **Root directory:** `/` (o la ruta del proyecto si es un monorepo)
   - El gestor de paquetes se detecta por `packageManager` (pnpm). Los build
     scripts nativos ya están aprobados en `pnpm-workspace.yaml` (`allowBuilds`),
     así el `pnpm install` del CI no se bloquea.
4. **Variables de entorno del proyecto** (en Workers Builds → Settings):
   - *Build & runtime* — añade las `NEXT_PUBLIC_*` (se necesitan en el build):
     `NEXT_PUBLIC_SITE_URL=https://catalii.com`, `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PADDLE_ENV`,
     `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_PRICE_*`.
   - *Secrets (runtime, cifrados)* — `SUPABASE_SERVICE_ROLE_KEY`,
     `PADDLE_API_KEY`, `PADDLE_NOTIFICATION_WEBHOOK_SECRET`,
     `PADDLE_PRODUCT_STARTER/PRO/BUSINESS`.
5. Cada `git push` a la rama de producción dispara build + deploy automáticos.

> Node: Cloudflare usa Node 20+ por defecto (compatible con Next 16). Si tu CI
> necesita fijarlo, define la variable `NODE_VERSION` en los ajustes de build.


### Troubleshooting deploy

**`ERROR Could not find compiled Open Next config, did you run the build command?`**
El paso de deploy no encontró `.open-next/`. Casi siempre es porque el **Build
command** del proyecto en Cloudflare NO es `pnpm cf:build` (quedó `next build`,
que compila Next pero no genera el Worker de OpenNext). Solución: en Settings →
Build, pon **Build command = `pnpm cf:build`** y **Deploy command =
`npx opennextjs-cloudflare deploy`**, y vuelve a desplegar.

Pista rápida: en los logs del build debes ver las líneas de OpenNext
(`Bundling middleware...`, `Worker saved in .open-next/worker.js`,
`OpenNext build complete`). Si no aparecen, el build command es incorrecto.



## Imágenes en R2 (productos, logos y banners)

- **Productos:** hasta 3 fotos; la primera es la principal.
- **Negocio:** foto de perfil/logo y banner por defecto (*Ajustes*).
- **Catálogos:** logo y banner propios; si no tienen, heredan los del negocio.

### Cómo funciona

1. El navegador comprime cada imagen (`src/lib/media/resize.ts`): una versión
   optimizada en WebP (JPEG si el navegador no codifica WebP) y una miniatura.
   | Tipo | Optimizada | Miniatura |
   |---|---|---|
   | Producto | ≤ 1600 px, ≤ 1.5 MB | ≤ 480 px |
   | Logo | 512×512 (recorte cuadrado) | 128×128 |
   | Banner | 1800×600 (recorte 3:1) | 600×200 |
2. `POST /api/uploads` revalida en el servidor (sesión, mismo origen, firma de
   bytes, dimensiones y peso), genera la clave y escribe ambos objetos en R2.
3. La BD guarda solo la **clave** (`product.images`, `*.logo_key`,
   `*.banner_key`; migración `0004_media.sql`). La URL se arma en
   `src/lib/media/config.ts`, así cambiar de dominio no obliga a migrar datos.
4. Al quitar/reemplazar una imagen o borrar un producto/catálogo se borran sus
   objetos de R2. Las subidas no guardadas se descartan (`DELETE /api/uploads`,
   que nunca borra claves referenciadas en la BD).

Clave: `<bucket>/<business_id>/<uuid>.webp` y su miniatura `<uuid>_t.webp`.

### Buckets (uno por tipo)

| Bucket | Binding | Contenido |
|---|---|---|
| `catalii-products` | `MEDIA_PRODUCTS` | Fotos de producto |
| `catalii-logos` | `MEDIA_LOGOS` | Logos / fotos de perfil |
| `catalii-banners` | `MEDIA_BANNERS` | Banners |

```bash
pnpm media:buckets   # crea los 3 buckets (una vez)
```

### Servidor de medios (`media-worker/`)

Worker aparte que solo sirve las imágenes (GET/HEAD, caché de borde, CORS,
caché inmutable de 1 año). Sin Next ni middleware de sesión.

```bash
pnpm media:deploy    # despliega catalii-media
```

Conecta un dominio (p. ej. `media.catalii.com`): hoy `media-worker/wrangler.jsonc`
**no tiene `routes` ni `custom_domain`**, hay que añadirlo (`PENDIENTES.md` #41).
Luego define en el **build** de la app
`NEXT_PUBLIC_MEDIA_URL=https://media.catalii.com`. Sin esa variable la app las
sirve por `/api/media/...` (fallback, también usado en `next dev`).

En local, `next dev` usa R2 emulado (`.wrangler/state`). Para probar el Worker
de medios: `pnpm media:dev` (comparte el mismo estado) y
`NEXT_PUBLIC_MEDIA_URL=http://localhost:8788`.


## Textos legales

Catalii es un **proyecto escolar**, así que los textos son cortos y solo afirman
lo que el código hace de verdad: no dicen que la app cumpla ninguna normativa,
no citan leyes ni plazos legales y no sustituyen a asesoría profesional. Las
tres páginas públicas (`/privacidad`, `/terminos`, `/contacto`) se generan desde
una fuente única, así que no hay texto duplicado que se desincronice:

```
src/lib/legal/config.ts    # DATOS: los 3 campos de COMPANY + el aviso de proyecto escolar
src/lib/legal/content.ts   # TEXTO: secciones de cada documento
docs/legal/textos/*.md     # copia en Markdown (generada, no se edita a mano)
```

**Solo hay que rellenar `config.ts`,** y son tres campos: `owner`,
`contactEmail` e `institution`. Lo que falta aparece marcado como
`[COMPLETAR]`. Mientras un documento tenga marcadores, su página lo avisa arriba
y se sirve con `noindex`; cuando no queda ninguno, el aviso desaparece y pasa a
ser indexable sin tocar código. Las tres páginas muestran además, arriba y
siempre, el aviso de que es un proyecto escolar en modo de pruebas.

```bash
pnpm legal:export   # regenera docs/legal/textos/, borra los .md huérfanos
                    # y lista los campos vacíos
```

> `legal:export` usa el `tsx` de `backend/`, así que necesita
> `pnpm -C backend install` una vez.

Qué falta: **`docs/legal/DATOS-PENDIENTES.md`**. `docs/legal/DIAGNOSTICO.md`,
`INVENTARIO.md` y `RESUMEN_ABOGADO.md` quedan como material histórico del
alcance anterior (seis páginas pensadas para un negocio real).

Al registrarse, el usuario marca una casilla de términos y privacidad y la
aceptación queda en la tabla `legal_acceptance` con documento, versión y fecha
UTC (migración `0005`). **Sube `LEGAL_VERSIONS` en `config.ts` cada vez que
cambie un texto publicado**, porque esa versión es la prueba de qué aceptó cada
usuario.

## Marca

Los logos están en `public/brand/` y la aplicación usa la **versión 2** (el
catálogo abierto, archivos con `-v2`):

| Uso | Archivo |
|---|---|
| Cabeceras, panel, login (símbolo + wordmark) | `catalii-simbolo-v2.svg` vía `BrandLogo` |
| Fondos oscuros (lámina completa) | `catalii-logo-v2-reverso.svg` |
| Open Graph / redes | `catalii-logo-v2-principal.png` |
| Favicon e iconos | `src/app/icon.svg`, `favicon.ico`, `apple-icon.png` |

`src/components/brand/brand-logo.tsx` combina el símbolo con el wordmark
tipográfico (`Wordmark`) en lugar del logo horizontal con el texto en contornos,
porque el texto debe heredar el color de cada theme (hay uno oscuro, `noche`).

Las fuentes editables (`.vectorcraft`) y las láminas de propuesta están en
`docs/brand/`, fuera de `public/`, para no servirlas en web. Ver
`docs/brand/README.md` y `CREDITS.md`.
