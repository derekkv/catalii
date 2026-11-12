-- Registro de aceptación de documentos legales (Términos y Privacidad).
-- BORRADOR técnico: los plazos de conservación y el contenido de los textos
-- los decide el dueño con su abogado. No se guarda IP (minimización).
-- No se guarda user_agent: no hace falta para acreditar versión ni momento.

create table legal_acceptance (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  document     text not null check (document in ('terms', 'privacy')),
  version      text not null check (char_length(version) between 1 and 60),
  -- timestamptz se almacena en UTC; se presenta en la zona del lector.
  accepted_at  timestamptz not null default now(),
  method       text not null check (method in ('signup_checkbox', 'reaccept_prompt')),
  -- Una misma versión de un documento solo se acepta una vez por usuario;
  -- hace idempotente el insert si el alta se reintenta.
  unique (user_id, document, version)
);
-- El índice único (user_id, document, version) ya cubre las consultas por usuario.

alter table legal_acceptance enable row level security;

-- Sin acceso para anon. El usuario solo puede LEER sus filas; no hay
-- INSERT/UPDATE/DELETE para authenticated: el registro es inmutable y solo lo
-- escribe el servidor con service_role. El borrado ocurre por ON DELETE
-- CASCADE al eliminar la cuenta de auth.users.
revoke all on legal_acceptance from anon, authenticated;
grant select on legal_acceptance to authenticated;
grant select, insert on legal_acceptance to service_role;

create policy legal_acceptance_owner_select on legal_acceptance for select to authenticated
  using (user_id = (select auth.uid()));
