-- Tres cosas, todas alrededor de los pedidos:
--   #12  Índices que faltaban (claves foráneas sin índice y business.email).
--   #29  Límite mensual de pedidos del plan (maxOrdersPerMonth), que estaba
--        anunciado pero no se comprobaba en ningún sitio.
--   #22  Límite de frecuencia de place_order (anti-inundación), porque el RPC
--        está concedido a `anon` y es el único endpoint escribible sin sesión.
--
-- Los límites se aplican DENTRO de place_order a propósito: es el único camino
-- común al front (Server Action) y al backend Express, y el pedido lo manda un
-- comprador anónimo, así que cualquier comprobación en el cliente es saltable.
--
-- Este archivo NO se ha ejecutado contra ninguna base real.


-- ---------------------------------------------------------------------------
-- 1. Índices que faltaban (#12)
-- ---------------------------------------------------------------------------

-- order_item.product_id es una FK con `on delete set null` sin índice: cada
-- `delete from product` obliga a Postgres a recorrer order_item entera para
-- encontrar las filas que tiene que poner a null.
create index if not exists order_item_product_idx on order_item (product_id);

-- "order".catalog_id, el mismo caso (`on delete set null` al borrar un
-- catálogo). Se crea COMPUESTO con created_at porque el límite de frecuencia
-- del punto 3 cuenta los pedidos recientes de un catálogo: a la FK le basta
-- con que catalog_id sea la primera columna, así que un solo índice sirve para
-- las dos cosas y no se paga dos veces la escritura.
create index if not exists order_catalog_created_idx on "order" (catalog_id, created_at desc);

-- business.email es la clave con la que el webhook de Paddle localiza el
-- negocio (src/lib/paddle/process-webhook.ts hace `.eq("email", email)`): sin
-- índice, cada customer.created/updated recorre business completa.
--
-- DECISIÓN: índice normal, NO unique. Motivos:
--   a) La columna es opcional (acepta null) y la edita el usuario desde
--      Ajustes. Con un unique, ese guardado fallaría con un error de base de
--      datos que hoy ninguna capa traduce a algo legible.
--   b) En Postgres varios null no colisionan, así que un unique NO garantiza
--      que el webhook encuentre un único negocio: deja pasar N negocios sin
--      correo, que es justo el caso ambiguo. El unique solo arreglaría una
--      parte del problema.
--   c) Puede haber duplicados ya creados; crear el unique sin limpiarlos antes
--      aborta la migración entera.
-- Si más adelante se decide que el correo sea único, primero hay que mirar si
-- hay duplicados (consulta de solo lectura, ejecútala a mano antes):
--
--   select lower(email) as email, count(*)
--   from business
--   where email is not null and email <> ''
--   group by 1
--   having count(*) > 1;
--
-- ...decidir con qué negocio se queda cada correo repetido y entonces:
--
--   create unique index business_email_key on business (email) where email is not null;
--
-- NOTA (fuera del alcance de esta migración): el webhook usa `.maybeSingle()`,
-- que con dos negocios con el mismo correo devuelve error y deja business_id
-- en null sin avisar. Es un fallo del lado TypeScript, no del índice.
create index if not exists business_email_idx on business (email);


-- ---------------------------------------------------------------------------
-- 2. Límite mensual de pedidos por plan (#29)
-- ---------------------------------------------------------------------------

-- El RPC no puede leer el TypeScript, así que los valores tienen que estar
-- también aquí.
--
-- MISMO DATO EN TRES SITIOS (hasta que se cierre la #27, desduplicar lógica):
--   · src/lib/plans.ts             -> PLANS[tier].limits.maxOrdersPerMonth
--   · backend/src/config/plans.ts  -> PLAN_LIMITS[tier].maxOrdersPerMonth
--   · esta función                 -> la única que ve place_order
-- Si cambias uno, cambia los tres. Los tres tienen un comentario avisando.
--
-- Devuelve null = ilimitado (equivalente al Infinity de plans.ts).
create or replace function plan_max_orders_per_month(p_plan public.plan_tier)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (case p_plan
    when 'free' then 20   -- anunciado como «20 pedidos/mes» en el plan Gratis
    else null             -- starter, pro y business: pedidos ilimitados
  end)::integer;
$$;

-- Nadie la llama desde fuera: place_order es `security definer` y su dueño
-- puede ejecutarla sin grant. Se deja accesible a service_role por si un job
-- o un script de soporte necesita consultar el límite.
revoke all on function plan_max_orders_per_month(public.plan_tier) from public, anon, authenticated;
grant execute on function plan_max_orders_per_month(public.plan_tier) to service_role;


-- ---------------------------------------------------------------------------
-- 3. place_order con los dos límites (#29 y #22)
-- ---------------------------------------------------------------------------
--
-- Se reemplaza la función de 0002_rls_and_rpc.sql conservando EXACTAMENTE la
-- misma firma (nombres de parámetros incluidos: PostgREST los usa por nombre)
-- y el mismo contrato de retorno. Lo añadido, en orden:
--   a) límite de frecuencia por catálogo y por teléfono (#22);
--   b) límite mensual de pedidos del plan del negocio (#29).
--
-- Los dos fallan con un SQLSTATE propio para que el llamante pueda ramificar
-- sin leer el texto del error:
--   PT429 -> demasiados pedidos seguidos (frecuencia).
--   PT402 -> el plan del negocio agotó sus pedidos del mes.
-- La clase «PT» no es casual: PostgREST traduce PTxxx al código HTTP xxx, así
-- que el front recibe 429 / 402 además del `code`. Si algún día deja de
-- hacerlo, el `code` sigue llegando y la rama en TypeScript sigue funcionando.
-- (PostgREST, «Custom Errors → RAISE errors with HTTP Status Codes»:
--  https://docs.postgrest.org/en/v12/references/errors.html#custom-errors)
-- NO se usan códigos de la clase 40* a propósito: PostgREST los interpreta
-- como fallo transitorio y reintenta la transacción.
-- Los mensajes están pensados para que un comprador los pueda leer, pero el
-- front NO los reenvía: traduce el `code` a su propio texto (ver
-- src/lib/actions/order-actions.ts y backend/src/services/order.service.ts).

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
  -- Umbrales del límite de frecuencia (#22). El razonamiento de por qué estos
  -- números está en supabase/README.md; resumen: 60 pedidos/hora en un mismo
  -- catálogo es muy por encima de cualquier ritmo real (el plan Gratis solo
  -- admite 20 al mes) y corta en seco un script, y 5 envíos en 10 minutos
  -- desde el mismo teléfono cubre el reenvío por nervios sin molestar a nadie.
  c_max_per_catalog_hour constant integer := 60;
  c_max_per_phone_10min  constant integer := 5;

  v_catalog   public.catalog%rowtype;
  v_order_id  uuid;
  v_total     integer := 0;
  v_currency  text := 'USD';
  v_item      jsonb;
  v_product   public.product%rowtype;
  v_qty       integer;
  v_subtotal  integer;
  v_count     integer := 0;

  v_now             timestamptz := now();  -- hora de inicio de la transacción
  v_whatsapp        text;
  v_phone_digits    text;
  v_recent_catalog  integer;
  v_recent_phone    integer;
  v_plan            public.plan_tier;
  v_max_monthly     integer;
  v_month_start     timestamptz;
  v_month_orders    integer;
begin
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

  -- Misma normalización que usa el insert de abajo, para que comparar no
  -- dependa de recordar el left/trim en dos sitios.
  v_whatsapp := left(trim(p_whatsapp), 25);
  -- Solo dígitos: así «+51 999 111 222» y «51999111222» cuentan como el mismo
  -- teléfono para el límite de frecuencia.
  v_phone_digits := regexp_replace(v_whatsapp, '[^0-9]', '', 'g');

  select * into v_catalog from public.catalog where slug = p_catalog_slug and is_public = true;
  if not found then
    raise exception 'Catálogo no disponible.' using errcode = 'no_data_found';
  end if;

  -- -------------------------------------------------------------------------
  -- Límite de frecuencia (#22)
  -- -------------------------------------------------------------------------
  -- El RPC NO recibe la IP del comprador (PostgREST no la expone al SQL de
  -- forma fiable), así que se limita por lo único que sí hay: el catálogo y el
  -- teléfono del formulario.
  --
  -- Se cuentan los pedidos YA creados en "order" en vez de llevar una tabla de
  -- intentos: no hace falta guardar ningún dato personal nuevo (ni en claro ni
  -- hasheado) y no hay nada nuevo que purgar. Un intento RECHAZADO no se puede
  -- registrar de todos modos, porque el `raise` revierte la transacción
  -- completa, así que una tabla de intentos contendría exactamente las mismas
  -- filas que "order" y duplicaría el teléfono para nada.
  -- Consecuencia asumida: a quien ya está bloqueado no se le penaliza más, pero
  -- el techo se mantiene (nunca pasa de c_max_per_catalog_hour por hora).
  -- Defensas complementarias, si esto no basta: Turnstile en el formulario,
  -- dejar BACKEND_URL siempre configurada (placeOrderLimiter) o un WAF.
  select
    count(*) filter (where o.created_at >= v_now - interval '1 hour'),
    count(*) filter (
      where o.created_at >= v_now - interval '10 minutes'
        and v_phone_digits <> ''
        and regexp_replace(o.customer_whatsapp, '[^0-9]', '', 'g') = v_phone_digits
    )
  into v_recent_catalog, v_recent_phone
  from public."order" o
  where o.catalog_id = v_catalog.id
    and o.created_at >= v_now - interval '1 hour';

  if v_recent_catalog >= c_max_per_catalog_hour or v_recent_phone >= c_max_per_phone_10min then
    -- Mensaje deliberadamente genérico: no se le dice a quien ataca qué regla
    -- saltó ni con qué umbral.
    raise exception 'Estamos recibiendo demasiados pedidos. Espera unos minutos e intenta de nuevo.'
      using errcode = 'PT429';
  end if;

  -- -------------------------------------------------------------------------
  -- Límite mensual del plan (#29)
  -- -------------------------------------------------------------------------
  select b.plan into v_plan from public.business b where b.id = v_catalog.business_id;
  v_max_monthly := public.plan_max_orders_per_month(v_plan);

  if v_max_monthly is not null then
    -- CRITERIO: mes CALENDARIO en UTC. Es lo que entiende un vendedor al leer
    -- «20 pedidos/mes», se reinicia solo el día 1 y no obliga a guardar una
    -- fecha de inicio de ciclo por negocio. Se calcula sin depender del
    -- TimeZone de la sesión (esta función fija search_path pero no la zona).
    v_month_start := date_trunc('month', (v_now at time zone 'utc')) at time zone 'utc';

    -- CRITERIO: los pedidos 'cancelled' NO cuentan. Si el vendedor cancela un
    -- pedido duplicado, falso o que el comprador retiró, no debe gastarle
    -- cupo. Contrapartida asumida: un vendedor puede cancelar para liberar
    -- cupo. Se acepta porque esto es un límite comercial, no una defensa de
    -- seguridad: del abuso se encarga el límite de frecuencia de arriba.
    select count(*) into v_month_orders
    from public."order" o
    where o.business_id = v_catalog.business_id
      and o.created_at >= v_month_start
      and o.status <> 'cancelled';

    if v_month_orders >= v_max_monthly then
      -- El culpable es el plan del mayorista, no el comprador: por eso el
      -- mensaje le dice qué hacer (hablar con el vendedor) y no menciona
      -- planes, cupos ni nada interno del negocio.
      raise exception 'Este catálogo no puede recibir más pedidos por ahora. Contacta al vendedor.'
        using errcode = 'PT402';
    end if;
  end if;

  insert into public."order" (
    business_id, catalog_id, customer_name, customer_whatsapp, customer_email, notes, total_cents, currency
  ) values (
    v_catalog.business_id, v_catalog.id,
    left(trim(p_name), 120),
    v_whatsapp,
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

-- `create or replace function` conserva los privilegios existentes; se repiten
-- igual que en 0002 para que esta migración valga también si la función no
-- estuviera creada.
revoke all on function place_order(text, text, text, text, text, jsonb) from public;
grant execute on function place_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- No se crea ninguna tabla nueva, así que no hay nada nuevo que purgar al
-- estilo de 0006_purge_processed_webhooks.sql. Los pedidos antiguos los
-- borrará lo que se decida en la #11 (retención), que sigue pendiente.
