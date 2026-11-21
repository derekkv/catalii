-- Mensajes del formulario de contacto público (/contacto).
--
-- Quién escribe: SIEMPRE el servidor con service_role. `anon` y `authenticated`
-- no tienen ningún permiso sobre la tabla, así que desde el navegador no se
-- puede leer ni enumerar lo que han escrito otros. RLS queda activo y sin
-- policies: con RLS activo y cero policies nadie pasa, y service_role no pasa
-- por RLS.
--
-- No se guarda IP ni user agent (minimización, igual que legal_acceptance): lo
-- que se necesita para responder es el correo que la persona escribe.

create table contact_message (
  id          uuid primary key default gen_random_uuid(),
  sender_name  text not null check (char_length(btrim(sender_name)) between 2 and 80),
  sender_email text not null check (
    char_length(btrim(sender_email)) between 5 and 160
    and position('@' in sender_email) > 1
  ),
  subject     text not null check (subject in ('duda', 'problema', 'datos', 'contenido', 'otro')),
  message     text not null check (char_length(btrim(message)) between 10 and 2000),
  -- Si lo envía alguien con sesión queda vinculado, para responder con
  -- contexto. `on delete set null`: borrar la cuenta desvincula el mensaje
  -- pero no lo elimina, porque puede ser una incidencia aún abierta.
  user_id     uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Se marca a mano cuando ya se respondió. Null = pendiente.
  handled_at  timestamptz
);

-- Listado del panel: lo más nuevo primero.
create index contact_message_created_idx on contact_message (created_at desc);

-- Sostiene el límite de envíos por correo y hora que comprueba la acción del
-- servidor antes de insertar.
create index contact_message_email_created_idx on contact_message (sender_email, created_at desc);

alter table contact_message enable row level security;

revoke all on contact_message from anon, authenticated;
grant select, insert, update on contact_message to service_role;
