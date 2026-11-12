-- Purga técnica del ledger de webhooks de Paddle (processed_webhook).
-- Solo contiene event_id y fecha (sin datos personales); se limpia por higiene.
-- NO toca datos de negocio (pedidos, compradores, cuentas): esos plazos son
-- una decisión pendiente del dueño (ver supabase/README.md).

create or replace function purge_processed_webhooks(retention interval default '90 days')
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint;
begin
  -- Paddle reintenta entregas durante días: una retención muy corta rompería
  -- la deduplicación. Se exige un mínimo de 7 días.
  if retention is null or retention < interval '7 days' then
    raise exception 'La retención mínima es de 7 días.' using errcode = 'check_violation';
  end if;

  delete from public.processed_webhook
  where processed_at < now() - retention;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function purge_processed_webhooks(interval) from public, anon, authenticated;
grant execute on function purge_processed_webhooks(interval) to service_role;

-- Programación OPCIONAL con pg_cron (NO se activa aquí). Si el dueño decide
-- activarla, habilitar la extensión pg_cron en Supabase y ejecutar a mano:
--
--   select cron.schedule(
--     'purge-processed-webhooks',          -- nombre del job
--     '17 3 * * *',                        -- diario 03:17 UTC
--     $$select public.purge_processed_webhooks('90 days')$$
--   );
--
-- Para desactivarla:  select cron.unschedule('purge-processed-webhooks');
