-- El negocio pasa a ser una entidad visible, no solo un contenedor.
--
-- Hasta ahora se pedían nombre, slug, WhatsApp y correo al registrarse y no se
-- usaban en ninguna página: cada catálogo parecía un negocio independiente.
-- Esta migración añade:
--
--   1. Los datos que describen al negocio (los rellena el dueño, todos
--      opcionales salvo los que ya existían).
--   2. Exposición pública CONTROLADA POR COLUMNA: la página pública del negocio
--      necesita leer algunos campos sin sesión, pero `email`, `plan` y
--      `owner_id` siguen sin ser accesibles para `anon`.
--   3. Métricas agregadas por día (visitas y clics) sin ningún dato personal.
--
-- Este archivo NO se ha ejecutado contra ninguna base real.


-- ---------------------------------------------------------------------------
-- 1. Datos del negocio
-- ---------------------------------------------------------------------------
alter table business
  -- Frase corta bajo el nombre ("Distribuidora de abarrotes desde 1998").
  add column if not exists tagline text
    check (tagline is null or char_length(tagline) <= 160),
  add column if not exists description text
    check (description is null or char_length(description) <= 2000),
  -- Rubro. Texto libre a propósito: una lista cerrada envejece mal y el
  -- catálogo de rubros reales de un mayorista es imprevisible.
  add column if not exists category text
    check (category is null or char_length(category) <= 80),
  add column if not exists phone text
    check (phone is null or char_length(phone) <= 25),
  add column if not exists address text
    check (address is null or char_length(address) <= 240),
  add column if not exists city text
    check (city is null or char_length(city) <= 120),
  add column if not exists country text
    check (country is null or char_length(country) <= 80),
  add column if not exists website text
    check (website is null or char_length(website) <= 300),
  -- Solo el usuario, sin URL ni arroba: la URL se arma en el front. Así no hay
  -- que validar dominios ni permitir que alguien meta un enlace cualquiera.
  add column if not exists instagram text
    check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  add column if not exists facebook text
    check (facebook is null or facebook ~ '^[A-Za-z0-9._-]{1,60}$'),
  -- Horario como texto libre: "Lun a Vie 9-18, Sáb 9-13" es más útil y más
  -- fácil de mantener que una estructura por días que nadie rellena entero.
  add column if not exists hours text
    check (hours is null or char_length(hours) <= 300),
  -- La página del negocio arranca despublicada: el dueño decide cuándo abrirla,
  -- igual que con los catálogos.
  add column if not exists is_public boolean not null default false,
  -- Si la página del negocio lista además todos sus productos visibles.
  add column if not exists show_products boolean not null default true;


-- ---------------------------------------------------------------------------
-- 2. Lectura pública del negocio, columna por columna
-- ---------------------------------------------------------------------------
-- `anon` solo puede leer las columnas de esta lista, y solo de negocios
-- publicados (política de abajo). `email`, `plan`, `owner_id`, `updated_at` y
-- las columnas de Paddle NO están, así que un `select email from business`
-- desde el navegador falla por permisos, no solo por RLS.
--
-- `whatsapp` SÍ está: es el canal por el que el negocio quiere que le escriban
-- y los catálogos públicos ya lo exponen, así que ocultarlo aquí solo obligaba
-- a sacarlo del primer catálogo que tuviera número. `email` se queda fuera a
-- propósito: es la llave con la que el webhook de Paddle localiza el negocio.
--
-- Postgres suma los privilegios de columna a los de tabla, así que esto no
-- quita nada al dueño: `authenticated` conserva su `grant select` completo de
-- 0002 y sigue viendo todo lo suyo.
grant select (
  id, name, slug, tagline, description, category,
  whatsapp, phone, address, city, country, website, instagram, facebook, hours,
  theme, logo_url, logo_key, banner_key, is_public, show_products, created_at
) on business to anon;

-- Se SUMA a business_owner_select (las políticas de SELECT se combinan con OR):
-- el dueño ve su negocio siempre; cualquiera ve los publicados.
drop policy if exists business_public_select on business;
create policy business_public_select on business for select to anon, authenticated
  using (is_public);

-- La página pública se busca por slug.
create index if not exists business_public_slug_idx on business (slug) where is_public;


-- ---------------------------------------------------------------------------
-- 3. Métricas agregadas (visitas y clics)
-- ---------------------------------------------------------------------------
-- Decisión: se guarda un CONTADOR POR DÍA, no un registro por visita.
--
--   · No hay IP, ni user agent, ni identificador de visitante, ni cookies:
--     nada que permita reconstruir el comportamiento de una persona. Por eso
--     esta tabla no añade datos personales al inventario.
--   · Una fila por (negocio, catálogo, tipo, día) en vez de millones de filas
--     de eventos: las consultas del panel son sumas triviales y la tabla no
--     crece sin control.
--
-- Contrapartida aceptada: no se puede distinguir visitantes únicos de visitas
-- repetidas, ni saber de dónde llega el tráfico. Para eso haría falta una
-- herramienta de analítica, con las implicaciones de privacidad que eso trae.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'metric_kind') then
    create type metric_kind as enum (
      'business_view',   -- alguien abrió la página del negocio
      'catalog_view',    -- alguien abrió un catálogo público
      'whatsapp_click',  -- alguien pulsó un enlace de WhatsApp
      'order_sent'       -- se envió un pedido (se cuenta además en "order")
    );
  end if;
end $$;

create table if not exists page_metric (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references business (id) on delete cascade,
  catalog_id   uuid references catalog (id) on delete cascade,
  kind         metric_kind not null,
  day          date not null,
  count        integer not null default 0 check (count >= 0),
  -- `catalog_id` es nulo en los eventos del negocio, y en un índice único los
  -- NULL no colisionan entre sí, así que se duplicarían filas. Esta columna
  -- generada da un valor estable para esos casos y permite un `on conflict`
  -- normal en el RPC de abajo.
  catalog_key  uuid not null generated always as
    (coalesce(catalog_id, '00000000-0000-0000-0000-000000000000'::uuid)) stored,
  unique (business_id, kind, day, catalog_key)
);

create index if not exists page_metric_business_day_idx on page_metric (business_id, day desc);
create index if not exists page_metric_day_idx on page_metric (day desc);

alter table page_metric enable row level security;

-- Nadie lee esta tabla desde el navegador: el panel del mayorista y el panel de
-- administración la consultan desde el servidor. `anon` solo puede incrementar
-- a través del RPC, que es `security definer`.
revoke all on page_metric from anon, authenticated;
grant select, insert, update on page_metric to service_role;

create policy page_metric_owner_select on page_metric for select to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())));


-- Incremento del contador del día.
--
-- Recibe slugs y no ids: lo llama el navegador, que no conoce los uuid, y así
-- se valida de paso que el catálogo o el negocio sean realmente públicos. Si no
-- lo son, no cuenta nada y no da error (la métrica no debe romper una página).
create or replace function track_metric(
  p_kind text,
  p_catalog_slug text default null,
  p_business_slug text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind        public.metric_kind;
  v_business_id uuid;
  v_catalog_id  uuid;
begin
  -- Tipo desconocido: se ignora en silencio en vez de reventar la página.
  begin
    v_kind := p_kind::public.metric_kind;
  exception when others then
    return;
  end;

  if p_catalog_slug is not null then
    select c.id, c.business_id into v_catalog_id, v_business_id
    from public.catalog c
    where c.slug = p_catalog_slug and c.is_public;
  elsif p_business_slug is not null then
    select b.id into v_business_id
    from public.business b
    where b.slug = p_business_slug and b.is_public;
  end if;

  if v_business_id is null then
    return; -- no existe, o no es público: no se cuenta
  end if;

  insert into public.page_metric (business_id, catalog_id, kind, day, count)
  values (v_business_id, v_catalog_id, v_kind, (now() at time zone 'utc')::date, 1)
  on conflict (business_id, kind, day, catalog_key)
    do update set count = public.page_metric.count + 1;
end;
$$;

-- Lo llama el navegador del comprador, sin sesión.
--
-- Nota de abuso: cualquiera puede llamarlo en bucle e inflar los contadores.
-- Se acepta a cambio de no identificar a nadie; si algún día importa la
-- exactitud, el camino es firmar el evento en el servidor o mover el conteo
-- detrás del rate limit del backend.
revoke all on function track_metric(text, text, text) from public;
grant execute on function track_metric(text, text, text) to anon, authenticated;
