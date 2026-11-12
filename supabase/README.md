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
| 0007_order_limits_and_indexes.sql | Índices que faltaban, límite mensual de pedidos del plan y límite de frecuencia dentro de `place_order` |

## legal_acceptance

- Una fila por documento (`terms`, `privacy`) y versión (`LEGAL_VERSIONS` en `src/lib/legal/config.ts`) aceptada. `unique (user_id, document, version)`.
- Inmutable: RLS con solo `SELECT` de filas propias; sin grants de INSERT/UPDATE/DELETE para `authenticated` ni acceso para `anon`. Escribe únicamente el servidor con `service_role` tras un `signUp` exitoso.
- Se borra por `ON DELETE CASCADE` al eliminar el usuario de `auth.users`.
- No se guarda IP ni user agent (minimización).
- Si el insert falla, el error se registra en el log del servidor y **no** se bloquea el alta (la cuenta ya existe). Revisa esos logs: una aceptación sin registrar es un hueco de evidencia.
- Con "Confirm email" activo y un correo ya registrado, Supabase devuelve un usuario sin identidades; en ese caso no se registra nada.

## Purga técnica de webhooks (orden 5, parte técnica)

`purge_processed_webhooks(retention interval default '90 days')` borra de `processed_webhook` (solo `event_id` y fecha; sin datos personales) lo anterior a la retención. Mínimo 7 días. **No está programada**: las instrucciones para `pg_cron` están comentadas al final de `0006`; activarla es decisión del dueño.

## 0007: índices, límite mensual y límite de frecuencia

Una sola migración para las tareas #12, #29 y #22, porque las tres tocan los pedidos y comparten un índice. **No ejecutada** contra ninguna base real; sí validada con el parser de Postgres (ver «Cómo se revisó» más abajo).

### Índices (#12)

| Índice | Para qué |
|---|---|
| `order_item_product_idx (product_id)` | La FK es `on delete set null`: sin índice, borrar un producto recorre `order_item` entera |
| `order_catalog_created_idx ("order" (catalog_id, created_at desc))` | Igual para `on delete set null` al borrar un catálogo **y** para contar los pedidos recientes del límite de frecuencia. A la FK le basta con que `catalog_id` sea la primera columna, así que un solo índice sirve para las dos cosas |
| `business_email_idx (email)` | El webhook de Paddle busca el negocio por correo (`.eq("email", email)`); sin índice es un recorrido completo en cada `customer.created/updated` |

**`business.email`: índice normal, no `unique`.** La columna es opcional y la edita el usuario desde Ajustes, así que un `unique` convertiría un correo repetido en un error de base de datos que hoy ninguna capa traduce. Además, en Postgres varios `null` no colisionan: el `unique` no garantizaría que el webhook encuentre un único negocio, porque el caso ambiguo de verdad (negocios sin correo) seguiría permitido. Y si ya existen duplicados, crear el `unique` aborta la migración. La consulta para detectar duplicados y la sentencia `create unique index ... where email is not null` están comentadas en la migración para cuando se decida.

Detalle aparte, del lado TypeScript (no se tocó, no es de esta tarea): el webhook usa `.maybeSingle()`, que con dos negocios con el mismo correo devuelve error y deja `business_id` en `null` sin avisar.

### Límite mensual de pedidos del plan (#29)

Se aplica **dentro de `place_order`**, el único camino común al front y al backend. Los valores por plan están en la función `plan_max_orders_per_month(plan_tier)` (`null` = ilimitado), porque el RPC no puede leer el TypeScript.

- **Criterio de mes: mes calendario en UTC.** Es lo que entiende el vendedor al leer «20 pedidos/mes», se reinicia solo el día 1 y no obliga a guardar una fecha de ciclo por negocio. Se calcula sin depender del `TimeZone` de la sesión.
- **Los `cancelled` no cuentan.** Si el vendedor cancela un pedido duplicado, falso o retirado, no debe gastarle cupo. Contrapartida aceptada: puede cancelar para liberar cupo. Es un límite comercial, no una defensa de seguridad; del abuso se encarga el límite de frecuencia.
- Se cuenta por **negocio** (el plan es del negocio), no por catálogo.
- **Mismo dato en tres sitios** hasta que se cierre la #27: `src/lib/plans.ts`, `backend/src/config/plans.ts` y esta función SQL. Los tres llevan un comentario avisando.

### Límite de frecuencia de `place_order` (#22)

`place_order` está concedido a `anon` y es el único endpoint escribible sin sesión. El RPC **no recibe la IP** del comprador (PostgREST no la expone al SQL de forma fiable), así que se limita por lo que sí hay: el catálogo y el teléfono del formulario.

| Regla | Umbral | Por qué |
|---|---|---|
| Por catálogo | 60 pedidos / 1 h | Muy por encima de cualquier ritmo real (el plan Gratis admite 20 al mes) y corta en seco un script |
| Por teléfono y catálogo | 5 pedidos / 10 min | Cubre el reenvío por nervios o el doble clic sin molestar a un comprador real. Se comparan solo los dígitos, así que cambiar el formato del número no lo salta |

**No se añade ninguna tabla ni ningún dato personal nuevo** (tampoco hasheado): se cuentan los pedidos ya existentes en `"order"`. Motivo: un intento **rechazado** no se puede registrar de ninguna manera, porque el `raise` revierte la transacción completa; una tabla de intentos contendría por tanto exactamente las mismas filas que `"order"` y duplicaría el teléfono para nada. Por eso tampoco hay función de purga nueva: los pedidos antiguos los borrará lo que se decida en la retención (pendiente, ver abajo). **`docs/legal/INVENTARIO.md` no necesita entradas nuevas por esta migración.**

Consecuencias asumidas:

- A quien ya está bloqueado no se le penaliza más (sus intentos rechazados no dejan rastro), pero el techo se mantiene: nunca pasa de 60 pedidos por hora y catálogo.
- Durante una inundación, los compradores reales de ese catálogo también quedan bloqueados mientras dure la ventana. Es inherente a limitar por catálogo cuando no hay IP.
- Defensas complementarias si esto no basta: Turnstile en el formulario, dejar `BACKEND_URL` siempre configurada (así entra `placeOrderLimiter`, que sí limita por IP) o un WAF.

### Cómo llega el error al comprador

Los dos límites fallan con un SQLSTATE propio para que el llamante ramifique sin leer el texto de Postgres:

| SQLSTATE | Significado | Mensaje al comprador |
|---|---|---|
| `PT429` | Demasiados pedidos seguidos | «Estamos recibiendo demasiados pedidos en este catálogo. Espera unos minutos e intenta de nuevo.» |
| `PT402` | El plan del negocio agotó sus pedidos del mes | «Este catálogo no puede recibir más pedidos por ahora. Contacta al vendedor.» |

La clase `PT` no es casual: PostgREST traduce `PTxxx` al código HTTP `xxx` ([documentación de PostgREST](https://docs.postgrest.org/en/v12/references/errors.html#custom-errors)), así que llega también un 429 / 402. Si algún día dejara de hacerlo, el `code` sigue llegando y la rama en TypeScript sigue funcionando. El texto lo escribe cada capa (`src/lib/actions/order-actions.ts` en el camino directo, `backend/src/services/order.service.ts` cuando hay backend): **nunca se reenvía `error.message`**, para no filtrar nombres de tabla, restricciones ni umbrales. Cualquier otro error sigue mostrando el genérico de antes.

### Qué hace falta para aplicarla

1. Ejecutar `0007_order_limits_and_indexes.sql` en un entorno de prueba (SQL Editor o CLI), después de 0001–0006.
2. Los `create index` toman un `ACCESS EXCLUSIVE` breve en tablas hoy pequeñas; si alguna ya tuviera volumen, cambiar a `create index concurrently` **fuera** de la migración (no admite transacción).
3. Comprobar a mano: enviar un pedido normal; con un negocio en plan Gratis que tenga 20 pedidos del mes en curso, ver el mensaje de `PT402`; repetir 6 envíos seguidos con el mismo teléfono y ver el de `PT429`.
4. Revisar que `select * from pg_indexes where tablename in ('order','order_item','business')` muestre los tres índices nuevos.

### Cómo se revisó el SQL

No hay acceso a ninguna base, ni `psql`, ni Docker en la máquina. Se validó la **sintaxis** con el parser real de Postgres (`libpg-query`, el mismo que usa el servidor), tanto el SQL de nivel superior como el cuerpo plpgsql de `place_order`, y se comprobó con un caso roto a propósito que el validador sí detecta errores. Eso **no** valida tipos, nombres de objetos, planes de consulta ni permisos: nada de la migración se ha ejecutado.

## DECISIONES PENDIENTES (no implementadas)

Los plazos de conservación de **pedidos, datos de compradores finales y cuentas inactivas/borradas** son una **decisión pendiente** del dueño con asesoría legal `[PREGUNTAR A ABOGADO]`. No hay borrado automático de datos de negocio.

## Borrado de cuenta: qué se propaga

El borrado (Configuración → Tus datos) cancela la suscripción en Paddle, borra objetos R2, vacía `paddle_customer.email` (la fila se conserva con `email = ''`, porque la columna es `NOT NULL` y los registros de facturación pueden tener obligación de conservación `[PREGUNTAR A ABOGADO]`) y elimina el usuario de Auth (cascada al resto).

Proveedores a los que hay que propagar/verificar el borrado: **Paddle** (no permite borrar clientes; conserva sus registros como comerciante de registro `[PREGUNTAR A ABOGADO]`), **Cloudflare R2** (se borran imágenes y miniaturas; puede quedar algún huérfano si falló, ver logs), **Supabase** (copias de seguridad según su política de retención), **proveedor de correo/SMTP de Auth** y cualquier registro de logs/analítica que se añada.
