# Supabase · migraciones

Las migraciones están en `migrations/` y se aplican **en orden** (a mano en el SQL Editor o con la CLI). Los archivos de este repositorio **no se han ejecutado** contra ninguna base real.

| Archivo | Contenido |
|---|---|
| 0001_init.sql | Tablas base |
| 0002_rls_and_rpc.sql | RLS, grants y `place_order` |
| 0003_default_theme_acero.sql | Tema por defecto |
| 0004_media.sql | Claves de imágenes (R2) |
| 0005_legal_acceptance.sql | Tabla `legal_acceptance` (aceptación de Términos y Privacidad) |
| 0006_purge_processed_webhooks.sql | Función `purge_processed_webhooks` (solo `service_role`) |

## legal_acceptance

- Una fila por documento (`terms`, `privacy`) y versión (`LEGAL_VERSIONS` en `src/lib/legal/config.ts`) aceptada. `unique (user_id, document, version)`.
- Inmutable: RLS con solo `SELECT` de filas propias; sin grants de INSERT/UPDATE/DELETE para `authenticated` ni acceso para `anon`. Escribe únicamente el servidor con `service_role` tras un `signUp` exitoso.
- Se borra por `ON DELETE CASCADE` al eliminar el usuario de `auth.users`.
- No se guarda IP ni user agent (minimización).
- Si el insert falla, el error se registra en el log del servidor y **no** se bloquea el alta (la cuenta ya existe). Revisa esos logs: una aceptación sin registrar es un hueco de evidencia.
- Con "Confirm email" activo y un correo ya registrado, Supabase devuelve un usuario sin identidades; en ese caso no se registra nada.

## Purga técnica de webhooks (orden 5, parte técnica)

`purge_processed_webhooks(retention interval default '90 days')` borra de `processed_webhook` (solo `event_id` y fecha; sin datos personales) lo anterior a la retención. Mínimo 7 días. **No está programada**: las instrucciones para `pg_cron` están comentadas al final de `0006`; activarla es decisión del dueño.

## DECISIONES PENDIENTES (no implementadas)

Los plazos de conservación de **pedidos, datos de compradores finales y cuentas inactivas/borradas** son una **decisión pendiente** del dueño con asesoría legal `[PREGUNTAR A ABOGADO]`. No hay borrado automático de datos de negocio.

## Borrado de cuenta: qué se propaga

El borrado (Configuración → Tus datos) cancela la suscripción en Paddle, borra objetos R2, vacía `paddle_customer.email` (la fila se conserva con `email = ''`, porque la columna es `NOT NULL` y los registros de facturación pueden tener obligación de conservación `[PREGUNTAR A ABOGADO]`) y elimina el usuario de Auth (cascada al resto).

Proveedores a los que hay que propagar/verificar el borrado: **Paddle** (no permite borrar clientes; conserva sus registros como comerciante de registro `[PREGUNTAR A ABOGADO]`), **Cloudflare R2** (se borran imágenes y miniaturas; puede quedar algún huérfano si falló, ver logs), **Supabase** (copias de seguridad según su política de retención), **proveedor de correo/SMTP de Auth** y cualquier registro de logs/analítica que se añada.
