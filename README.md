# Catalii — Catálogos digitales para mayoristas

MVP funcional de una plataforma SaaS multi-tenant donde un mayorista sube sus
productos y obtiene un **catálogo público** con búsqueda, filtros, carrito y
**pedidos sin login**. Incluye panel de gestión, **themes configurables**,
facturación con **Paddle** y base de datos en **Supabase** con RLS.

## Stack

- **Next.js 16** (App Router, React 19) + **TypeScript**
- **Tailwind CSS 4** — sistema de tokens en 3 capas con 6 themes (`data-theme`)
- **Supabase** — Postgres + Auth (magic link) + RLS multi-tenant
- **Paddle** — checkout, webhooks firmados y sincronización de suscripciones
- **zod** para validación, **papaparse** (import CSV), **qrcode** (QR de compartir)

## Estructura

```
src/
  app/
    page.tsx                # Landing de marketing
    login/                  # Acceso por magic link
    auth/confirm/           # Verificación del enlace de email
    c/[slug]/               # Catálogo PÚBLICO (comprador) + SEO + JSON-LD
    dashboard/              # Panel del mayorista (protegido)
      onboarding/           # Crear negocio
      productos/            # CRUD + import CSV
      pedidos/              # Gestión de pedidos
      catalogos/[id]/       # Config, theme, selección de productos, QR
      facturacion/          # Planes + checkout Paddle
      configuracion/        # Datos del negocio
    api/webhook/            # Webhook de Paddle (firma verificada)
    sitemap.ts, robots.ts   # SEO
  components/               # UI, theme, dashboard
  lib/
    supabase/               # clients: client / server / server-internal + proxy
    paddle/                 # instancia, webhook, customer id
    actions/                # server actions (auth, pedidos)
    themes.ts plans.ts validation.ts utils.ts site.ts
  proxy.ts                  # Sesión Supabase + protección de /dashboard
supabase/migrations/        # 0001_init.sql, 0002_rls_and_rpc.sql
```

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

Aplica las migraciones en orden. Con la CLI de Supabase:

```bash
supabase link --project-ref TU_REF
supabase db push          # aplica supabase/migrations/*.sql
```

O bien pega el contenido de `supabase/migrations/0001_init.sql` y luego
`0002_rls_and_rpc.sql` en **SQL Editor** del panel de Supabase.

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
Coca-Cola 600ml,CC600,12.50,240,Bebidas,Refresco,https://...
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

6 themes seleccionables (`vibrant`, `coral`, `ocean`, `midnight`, `luxe`,
`swiss`) definidos como variables CSS en `globals.css` bajo `[data-theme]`.
El usuario elige el theme de la app (persistido en `localStorage`) y cada
catálogo puede tener su propio theme (o heredar el del negocio).

## Notas

- Este MVP usa `<img>` para imágenes de productos por URL. Para producción,
  considera subirlas a Supabase Storage y usar `next/image` con `remotePatterns`.
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
  Para `pnpm cf:preview` en local, ponlos en `.dev.vars` (ver `.dev.vars.example`).

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
- El bundle del Worker pesa ~1.8 MB gzip (dentro del límite de Workers).


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
   - **Deploy command:** `npx wrangler deploy` (o deja el que sugiere Cloudflare)
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
