-- ============================================================================
-- CataloGO — Seguridad: RLS, grants y RPC transaccional de pedidos
-- ============================================================================

-- Habilitar RLS en TODAS las tablas del esquema público -----------------------
alter table business            enable row level security;
alter table product             enable row level security;
alter table catalog             enable row level security;
alter table catalog_product     enable row level security;
alter table price_list          enable row level security;
alter table customer            enable row level security;
alter table "order"             enable row level security;
alter table order_item          enable row level security;
alter table paddle_customer     enable row level security;
alter table paddle_subscription enable row level security;
alter table processed_webhook   enable row level security;

-- ── Privilegios de tabla (PostgREST/Data API) ───────────────────────────────
-- RLS controla QUÉ filas; los grants controlan si la tabla es alcanzable.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on business  to authenticated;
grant select, insert, update, delete on product   to authenticated;
grant select, insert, update, delete on catalog   to authenticated;
grant select, insert, update, delete on catalog_product to authenticated;
grant select, insert, update, delete on price_list to authenticated;
grant select, insert, update, delete on customer  to authenticated;
grant select, update, delete on "order"           to authenticated;
grant select on order_item                         to authenticated;
grant select on paddle_customer                    to authenticated;
grant select on paddle_subscription                to authenticated;

-- Lectura pública (solo catálogos publicados y sus productos activos)
grant select on catalog          to anon, authenticated;
grant select on product          to anon, authenticated;
grant select on catalog_product  to anon, authenticated;

-- processed_webhook: sin grants → inaccesible para anon/authenticated.
-- Solo service_role (bypass RLS) lo escribe desde el webhook.

-- ── Políticas: business ─────────────────────────────────────────────────────
create policy business_owner_select on business for select to authenticated
  using (owner_id = (select auth.uid()));
create policy business_owner_insert on business for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy business_owner_update on business for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy business_owner_delete on business for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ── Políticas: product ──────────────────────────────────────────────────────
create policy product_owner_all on product for all to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())))
  with check (business_id in (select id from business where owner_id = (select auth.uid())));

-- Lectura pública: productos activos que pertenecen a un catálogo público
create policy product_public_select on product for select to anon, authenticated
  using (
    active
    and exists (
      select 1 from catalog_product cp
      join catalog c on c.id = cp.catalog_id
      where cp.product_id = product.id and c.is_public
    )
  );

-- ── Políticas: catalog ──────────────────────────────────────────────────────
create policy catalog_owner_all on catalog for all to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())))
  with check (business_id in (select id from business where owner_id = (select auth.uid())));
create policy catalog_public_select on catalog for select to anon, authenticated
  using (is_public);

-- ── Políticas: catalog_product ──────────────────────────────────────────────
create policy catalog_product_owner_all on catalog_product for all to authenticated
  using (catalog_id in (
    select c.id from catalog c
    join business b on b.id = c.business_id
    where b.owner_id = (select auth.uid())))
  with check (catalog_id in (
    select c.id from catalog c
    join business b on b.id = c.business_id
    where b.owner_id = (select auth.uid())));
create policy catalog_product_public_select on catalog_product for select to anon, authenticated
  using (exists (select 1 from catalog c where c.id = catalog_id and c.is_public));

-- ── Políticas: price_list y customer (solo dueño) ───────────────────────────
create policy price_list_owner_all on price_list for all to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())))
  with check (business_id in (select id from business where owner_id = (select auth.uid())));

create policy customer_owner_all on customer for all to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())))
  with check (business_id in (select id from business where owner_id = (select auth.uid())));

-- ── Políticas: order / order_item (el dueño gestiona; inserta el RPC) ────────
create policy order_owner_select on "order" for select to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())));
create policy order_owner_update on "order" for update to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())))
  with check (business_id in (select id from business where owner_id = (select auth.uid())));
create policy order_owner_delete on "order" for delete to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())));

create policy order_item_owner_select on order_item for select to authenticated
  using (order_id in (
    select o.id from "order" o
    join business b on b.id = o.business_id
    where b.owner_id = (select auth.uid())));

-- ── Políticas: espejo de Paddle (el dueño lee su propia suscripción) ─────────
create policy paddle_customer_owner_select on paddle_customer for select to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())));
create policy paddle_subscription_owner_select on paddle_subscription for select to authenticated
  using (business_id in (select id from business where owner_id = (select auth.uid())));

-- ============================================================================
-- RPC: place_order — creación atómica de pedidos desde el catálogo público.
-- SECURITY DEFINER intencional: es un endpoint público (anon) que valida
-- internamente y RECALCULA los precios desde la tabla product (nunca confía en
-- los precios enviados por el cliente). Evita políticas amplias de INSERT anon.
-- ============================================================================
create or replace function place_order(
  p_catalog_slug text,
  p_name text,
  p_whatsapp text,
  p_email text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catalog   public.catalog%rowtype;
  v_order_id  uuid;
  v_total     integer := 0;
  v_currency  text := 'USD';
  v_item      jsonb;
  v_product   public.product%rowtype;
  v_qty       integer;
  v_subtotal  integer;
  v_count     integer := 0;
begin
  -- Validación de entrada
  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception 'Nombre requerido.' using errcode = 'check_violation';
  end if;
  if p_whatsapp is null or char_length(trim(p_whatsapp)) < 5 then
    raise exception 'WhatsApp requerido.' using errcode = 'check_violation';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos.' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_items) > 200 then
    raise exception 'Demasiados productos.' using errcode = 'check_violation';
  end if;

  -- El catálogo debe existir y estar publicado
  select * into v_catalog from public.catalog where slug = p_catalog_slug and is_public = true;
  if not found then
    raise exception 'Catálogo no disponible.' using errcode = 'no_data_found';
  end if;

  insert into public."order" (
    business_id, catalog_id, customer_name, customer_whatsapp, customer_email, notes, total_cents, currency
  ) values (
    v_catalog.business_id, v_catalog.id,
    left(trim(p_name), 120),
    left(trim(p_whatsapp), 25),
    nullif(left(trim(coalesce(p_email, '')), 160), ''),
    nullif(left(trim(coalesce(p_notes, '')), 1000), ''),
    0, 'USD'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    begin
      v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
      if v_qty <= 0 then
        continue;
      end if;

      select * into v_product from public.product
        where id = (v_item ->> 'product_id')::uuid
          and business_id = v_catalog.business_id
          and active = true;
      if not found then
        continue; -- ignora ítems inválidos sin abortar el pedido completo
      end if;

      if v_qty < v_product.min_order_qty then
        v_qty := v_product.min_order_qty;
      end if;

      -- Precio SIEMPRE recalculado desde la BD (no del cliente)
      v_subtotal := v_product.price_cents * v_qty;
      v_total := v_total + v_subtotal;
      v_currency := v_product.currency;

      insert into public.order_item (
        order_id, product_id, product_name, sku, quantity, unit_price_cents, subtotal_cents
      ) values (
        v_order_id, v_product.id, v_product.name, v_product.sku, v_qty, v_product.price_cents, v_subtotal
      );
      v_count := v_count + 1;
    exception
      when others then
        continue; -- uuid malformado u otro dato inválido: ignora el ítem
    end;
  end loop;

  if v_count = 0 then
    delete from public."order" where id = v_order_id;
    raise exception 'Ningún producto del pedido es válido.' using errcode = 'check_violation';
  end if;

  update public."order" set total_cents = v_total, currency = v_currency where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'total_cents', v_total, 'currency', v_currency);
end;
$$;

-- Revoca de PUBLIC y concede solo a los roles esperados
revoke all on function place_order(text, text, text, text, text, jsonb) from public;
grant execute on function place_order(text, text, text, text, text, jsonb) to anon, authenticated;
