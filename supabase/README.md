# Supabase (base de datos)

Esquema, políticas RLS y RPC de Catalii. Es la **misma** base que usan el front
(Next.js) y el back (Express). Todo el acceso respeta RLS: cada negocio solo ve
lo suyo.

## Migraciones

Se aplican **en orden**:

| Archivo | Qué hace |
|---------|----------|
| `migrations/0001_init.sql` | Tablas base: `business`, `product`, `catalog`, `catalog_product`, `order`, `order_item`, suscripciones de Paddle |
| `migrations/0002_rls_and_rpc.sql` | Políticas RLS por propiedad (`owner_id = auth.uid()`) y el RPC `place_order` |
| `migrations/0003_default_theme_acero.sql` | Theme por defecto |
| `migrations/0004_media.sql` | Columnas de imágenes en R2 (`product.images` jsonb, `logo_key`, `banner_key`) |

## Cómo aplicarlas

Con la CLI de Supabase:

```bash
supabase link --project-ref TU_REF
supabase db push
```

O pega el contenido de cada archivo, en orden, en el **SQL Editor** del panel.

## Modelo de datos (resumen)

- **business** — el mayorista. `owner_id = auth.uid()`. Datos privados (email,
  plan). No se expone a `anon`.
- **product** — productos del negocio. Precio en centavos. `images` jsonb con
  hasta 3 claves de R2.
- **catalog** — catálogo público (branding propio). `is_public` controla si se
  ve sin sesión.
- **catalog_product** — qué productos entran en cada catálogo y su orden.
- **order** / **order_item** — pedidos recibidos y sus renglones. Guardan nombre
  y precio histórico (no dependen de que el producto siga existiendo).

## Seguridad

- **RLS en todas las tablas**, con predicados de propiedad (no solo
  `TO authenticated`).
- **`place_order` es `SECURITY DEFINER`**: recalcula los precios desde la BD, así
  el cliente nunca fija el precio. Valida que el catálogo sea público, sanea la
  entrada y crea el pedido + líneas de forma atómica. Tiene `grant execute` a
  `anon` para que el catálogo público pueda enviar pedidos sin login.
- La clave `service_role` solo se usa en servidor (webhook de Paddle); nunca
  llega al navegador.

## Quién la consume

- **Front (Next.js)** — `src/lib/supabase/*` (cliente de navegador, de servidor
  SSR y service role interno).
- **Back (Express)** — `backend/src/lib/supabase.ts` (cliente por token con RLS,
  cliente anónimo para el catálogo público y service role para tareas de
  servidor).
