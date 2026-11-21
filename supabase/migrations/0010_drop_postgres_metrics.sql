-- Las métricas se van a MongoDB: se retira lo que la 0009 creó para ellas.
--
-- Por qué se mueven:
--
--   · Los eventos de visita y clic son escritura intensiva, append-only y de
--     forma variable (una visita trae país y referrer, un clic trae destino).
--     Eso encaja mejor en documentos que en una tabla.
--   · La 0009 guardaba solo un CONTADOR por día, así que respondía «cuántas
--     visitas hubo» y nada más. Guardando el evento se pueden responder
--     después preguntas que hoy no están planteadas.
--   · Los índices TTL de MongoDB borran los eventos viejos solos, sin `pg_cron`
--     ni proceso externo (pendiente #11, retención).
--   · La analítica deja de compartir base con los datos transaccionales: si
--     Mongo no responde, no se pierde ningún pedido.
--
-- Lo demás que añadió la 0009 (campos del perfil del negocio, lectura pública
-- por columna, índice y política) SE QUEDA: es lo que hace funcionar las
-- páginas públicas de negocio.
--
-- Esta migración es destructiva: borra la tabla de contadores y lo que haya en
-- ella. Si ya se habían registrado visitas y se quieren conservar, exporta
-- antes:
--
--   copy (select business_id, catalog_id, kind, day, count from page_metric)
--     to '/tmp/page_metric.csv' with csv header;
--
-- Al momento de escribirla, la 0009 acababa de aplicarse y la tabla estaba
-- vacía o casi.

-- El RPC primero: es lo que llamaba el navegador.
drop function if exists track_metric(text, text, text);

-- La tabla se lleva sus índices, su columna generada y sus políticas.
drop table if exists page_metric;

-- El enum solo lo usaba esa tabla. `metric_kind` pasa a ser una cadena
-- validada en el backend (ver backend/src/metrics).
drop type if exists metric_kind;
