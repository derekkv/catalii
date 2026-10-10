-- ============================================================================
-- Catalii — Imágenes subidas a Cloudflare R2
--
-- Las imágenes viven en 3 buckets R2 (ver wrangler.jsonc):
--   catalii-products  → fotos de producto (hasta 3 por producto)
--   catalii-logos     → foto de perfil / logo de negocios y catálogos
--   catalii-banners   → banners de negocios y catálogos
--
-- En la BD se guarda solo la CLAVE del objeto, nunca la URL: la URL pública se
-- construye en la app (src/lib/media/config.ts), así cambiar de dominio de
-- medios (p. ej. media.catalii.com) no obliga a reescribir filas.
--
-- Formato de clave:  <bucket>/<business_id>/<uuid>.<webp|jpg>
-- Cada imagen tiene además su miniatura en <bucket>/<business_id>/<uuid>_t.<ext>
-- (no se guarda: se deriva de la clave principal).
--
-- Las columnas *_url existentes se conservan para URLs externas (import CSV y
-- datos antiguos). Si hay clave, tiene prioridad sobre la URL.
-- ============================================================================

-- Patrón de clave por bucket. Se repite en src/lib/media/config.ts.
-- uuid: 8-4-4-4-12 hex en minúsculas.

-- ── Productos: hasta 3 imágenes ─────────────────────────────────────────────
-- jsonb: [{ "key": "products/<biz>/<uuid>.webp", "w": 1600, "h": 1200 }, ...]
-- El primer elemento es la imagen principal.
alter table product
  add column images jsonb not null default '[]'::jsonb;

alter table product
  add constraint product_images_shape check (
    jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 3
  );

-- ── Catálogos: logo (perfil) y banner subidos ───────────────────────────────
alter table catalog
  add column logo_key   text,
  add column banner_key text;

alter table catalog
  add constraint catalog_logo_key_format check (
    logo_key is null or logo_key ~ '^logos/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
  ),
  add constraint catalog_banner_key_format check (
    banner_key is null or banner_key ~ '^banners/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
  );

-- ── Negocio: logo (perfil) y banner por defecto ─────────────────────────────
-- Los catálogos sin logo/banner propio heredan los del negocio.
alter table business
  add column logo_key   text,
  add column banner_key text;

alter table business
  add constraint business_logo_key_format check (
    logo_key is null or logo_key ~ '^logos/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
  ),
  add constraint business_banner_key_format check (
    banner_key is null or banner_key ~ '^banners/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
  );

-- ============================================================================
-- RPC: branding heredado del negocio para el catálogo público.
--
-- `business` NO es legible por anon (expone email, plan, owner). Esta función
-- devuelve SOLO las claves de imagen, y solo si el catálogo está publicado.
-- ============================================================================
create or replace function public_catalog_branding(p_slug text)
returns table (logo_key text, banner_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.logo_key, b.banner_key
  from public.catalog c
  join public.business b on b.id = c.business_id
  where c.slug = p_slug and c.is_public = true
  limit 1;
$$;

revoke all on function public_catalog_branding(text) from public;
grant execute on function public_catalog_branding(text) to anon, authenticated;
