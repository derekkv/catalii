# CataloGO — Catálogos digitales para mayoristas

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
