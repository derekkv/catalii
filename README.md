# Catalii — Catálogos digitales para mayoristas

MVP funcional de una plataforma SaaS multi-tenant donde un mayorista sube sus
productos y obtiene un **catálogo público** con búsqueda, filtros, carrito y
**pedidos sin login**. Incluye panel de gestión, **themes configurables**,
facturación con **Paddle** y base de datos en **Supabase** con RLS.

## Stack

- **Next.js 16** (App Router, React 19) + **TypeScript**
- **Tailwind CSS 4** — sistema de tokens por theme + escala tipográfica (`data-theme`)
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

Conecta un dominio (p. ej. `media.catalii.com`, ver `routes` en
`media-worker/wrangler.jsonc`) y define en el **build** de la app
`NEXT_PUBLIC_MEDIA_URL=https://media.catalii.com`. Sin esa variable la app las
sirve por `/api/media/...` (fallback, también usado en `next dev`).

En local, `next dev` usa R2 emulado (`.wrangler/state`). Para probar el Worker
de medios: `pnpm media:dev` (comparte el mismo estado) y
`NEXT_PUBLIC_MEDIA_URL=http://localhost:8788`.
