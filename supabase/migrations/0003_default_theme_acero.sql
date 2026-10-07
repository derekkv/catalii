-- Acero pasa a ser el theme por defecto (antes 'vibrant', un id heredado).
-- Sólo cambia el default de columna para negocios nuevos; no toca los que ya
-- eligieron un theme.
alter table public.business alter column theme set default 'acero';
