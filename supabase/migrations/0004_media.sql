alter table product
  add column images jsonb not null default '[]'::jsonb;

alter table product
  add constraint product_images_shape check (
    jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 3
  );

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
