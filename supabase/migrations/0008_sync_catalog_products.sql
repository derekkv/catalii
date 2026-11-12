-- Sincroniza en una sola transacción el conjunto de productos de un catálogo.
--
-- Antes el front hacía `delete` de todas las filas de catalog_product y luego
-- `insert` de las nuevas en dos llamadas independientes y sin comprobar
-- errores: si el insert fallaba, el catálogo se quedaba vacío. Aquí las dos
-- sentencias viven en el cuerpo de la función, así que comparten transacción:
-- si el insert falla, el delete se deshace y el catálogo queda como estaba.
--
-- `security definer` porque la función salta RLS para hacer el reemplazo
-- completo; por eso la propiedad del catálogo se comprueba explícitamente
-- contra auth.uid() y los productos se filtran por el business_id del propio
-- catálogo. `search_path` fijo para que no se pueda resolver un nombre a un
-- objeto de otro esquema (mismo patrón que place_order en 0002).

create or replace function sync_catalog_products(
  p_catalog_id  uuid,
  p_product_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catalog   public.catalog%rowtype;
  v_requested integer := coalesce(array_length(p_product_ids, 1), 0);
  v_count     integer;
begin
  if p_catalog_id is null then
    raise exception 'Catálogo inválido.' using errcode = 'check_violation';
  end if;
  if v_requested > 5000 then
    raise exception 'Demasiados productos.' using errcode = 'check_violation';
  end if;

  -- Propiedad: el catálogo tiene que ser de un negocio del usuario actual.
  select c.* into v_catalog
  from public.catalog c
  join public.business b on b.id = c.business_id
  where c.id = p_catalog_id
    and b.owner_id = auth.uid();
  if not found then
    raise exception 'Catálogo no encontrado.' using errcode = 'no_data_found';
  end if;

  delete from public.catalog_product where catalog_id = v_catalog.id;

  -- Solo productos del mismo negocio (los ajenos o inexistentes se descartan
  -- en el join). `with ordinality` conserva el orden en que llegaron y
  -- `distinct on` se queda con la primera aparición de cada producto, porque
  -- (catalog_id, product_id) es clave primaria y un repetido abortaría todo.
  insert into public.catalog_product (catalog_id, product_id, sort_order)
  select v_catalog.id,
         s.product_id,
         (row_number() over (order by s.ord))::integer - 1
  from (
    select distinct on (t.product_id) t.product_id, t.ord
    from unnest(coalesce(p_product_ids, '{}'::uuid[])) with ordinality as t(product_id, ord)
    join public.product p
      on p.id = t.product_id
     and p.business_id = v_catalog.business_id
    order by t.product_id, t.ord
  ) s;

  select count(*)::integer into v_count
  from public.catalog_product
  where catalog_id = v_catalog.id;

  -- El slug se devuelve para que la acción pueda invalidar /c/<slug> sin otra
  -- consulta (esa página tiene ISR, así que sin revalidar tarda en verse).
  return jsonb_build_object(
    'slug', v_catalog.slug,
    'count', v_count,
    'requested', v_requested
  );
end;
$$;

revoke all on function sync_catalog_products(uuid, uuid[]) from public;
grant execute on function sync_catalog_products(uuid, uuid[]) to authenticated;
