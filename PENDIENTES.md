# Pendientes de Catalii

Lista única de trabajo. Sale de analizar el código y todos los `.md` del repo
(`README`, `NOTAS-SEPARACION`, `docs/legal/*`, `CREDITS`, `THIRD_PARTY_NOTICES`,
`supabase/README`, `docs/brand/README`, `backend/README`).

**Cómo usarla:** cada tarea tiene un número estable. Marca la casilla al cerrarla
y deja la evidencia (comando, captura o archivo). No reordenes los números: si
algo se añade, va al final de su sección.

- **Tipo:** `TÉC` código o infraestructura · `DATO` solo lo sabes tú · `DECIS`
  decisión de negocio o legal · `VERIF` hay que probarlo · `DOC` documentación.
- **Esfuerzo:** `S` menos de medio día · `M` uno o dos días · `L` más.

**Avance al 2026-11-12:** cerradas 12 tareas (#1, #12, #23, #30, #31, #32, #36,
#46, #47, #48, #49 y, en código, #22 y #29). Todo lo escrito está commiteado y
pasa `tsc`, `eslint` y `next build`. Lo que queda son, en su mayoría, cosas que
**yo no puedo hacer**: datos que solo tienes tú, decisiones, y pruebas contra
Supabase, Paddle y un navegador reales.

## Empieza por aquí (en este orden)

1. **#2–#8** los datos legales: desbloquean el lanzamiento de las páginas.
2. **#9–#10** aplicar las cuatro migraciones pendientes (`0005`–`0008`) en un
   entorno de prueba. Varias tareas ya cerradas en código dependen de esto.
3. **#13–#16** probar con Paddle sandbox y con una cuenta real lo que está
   escrito pero nunca se ha ejecutado.
4. **#51** decidir si la CSP pasa a modo bloqueo (hoy solo observa).
5. **#25** decidir el futuro del backend Express.

---

## 1. Control de versiones

- [x] **#1 · TÉC · S — ~~Commitear el trabajo.~~** Hecho: seis commits
  temáticos (backend restaurado, front consume el back, páginas legales,
  accesibilidad y licencias, logos v2, lista de pendientes y MCP) más los de
  esta ronda. El árbol queda limpio.
  **Falta `git push`:** `main` va por delante de `origin/main` y empujar es tu
  decisión. Remoto: `git@github.com:derekkv/catalii.git`.

## 2. Datos legales que faltan (35 campos)

Todos se escriben en `src/lib/legal/config.ts`. Al guardar, ejecuta
`pnpm legal:export` para regenerar `docs/legal/textos/` y ver qué queda.
Detalle de cada campo y formato: `docs/legal/DATOS-PENDIENTES.md`.

- [ ] **#2 · DATO · S — Datos de la empresa (7 campos).** Razón social,
  identificación fiscal, domicilio, país y tres correos (contacto, privacidad,
  derechos de autor). Los correos deben existir y estar atendidos antes de
  publicar, porque los textos prometen respuesta ahí. Si operas como persona
  física, dilo y se ajusta la redacción.
- [ ] **#3 · DECIS · S — Plazos de conservación (6 campos).** Cuentas, pedidos y
  datos de compradores, facturación, registros técnicos, copias de seguridad y
  registros de conexión. Los dos últimos se consultan en los paneles de Supabase
  y Cloudflare. Bloquea la #11.
- [ ] **#4 · DECIS · S — Atención y avisos (4 campos).** Plazo de respuesta a
  solicitudes de datos y a soporte; cómo avisarás de cambios en la política y en
  los términos.
- [ ] **#5 · DECIS · S — Cobros y reembolsos (7 campos).** Si los precios llevan
  impuestos incluidos (depende de la #13), qué pasa con catálogos y datos al
  cancelar, y las condiciones, plazos y gestor de los reembolsos.
- [ ] **#6 · DECIS · S — Contenido y reclamos (3 campos).** Rubros no admitidos
  en los catálogos y plazos para atender un reclamo de derechos de autor.
- [ ] **#7 · DATO · S — Regiones de proveedores (5 campos).** Región de
  Supabase, Workers y R2; país y rol de Paddle; y si tienes aceptados sus
  acuerdos de tratamiento de datos.
- [ ] **#8 · DECIS · M — Revisión legal.** Llevar a un abogado
  `docs/legal/RESUMEN_ABOGADO.md` (19 preguntas) y cerrar los dos campos que son
  suyos: ley aplicable y jurisdicción. Quedan 22 marcas
  `[PREGUNTAR A ABOGADO]` en los textos hasta que responda: roles de responsable
  y encargado sobre los datos de los compradores, base jurídica de cada
  tratamiento, edad mínima, transferencias internacionales, límites de
  responsabilidad, derechos del consumidor y régimen de los avisos de autor.

> Mientras un documento tenga marcadores, su página avisa «Documento incompleto»
> y se sirve con `noindex`. Al rellenarlo todo, deja de avisar y pasa a ser
> indexable sin tocar código.

## 3. Base de datos

- [ ] **#9 · TÉC · M — Aplicar las cuatro migraciones pendientes.** `0005`,
  `0006`, `0007` y `0008` están escritas y **ninguna se ha ejecutado**. Es ahora
  la tarea que más cosas desbloquea, porque de ella dependen varias ya cerradas
  en código:
  - `0005_legal_acceptance.sql` — sin ella el registro de aceptación de términos
    falla y no hay prueba de quién aceptó qué.
  - `0006_purge_processed_webhooks.sql` — la purga del ledger de webhooks.
  - `0007_order_limits_and_indexes.sql` — índices (#12), límite mensual de
    pedidos (#29) y límite de frecuencia (#22).
  - `0008_sync_catalog_products.sql` — RPC atómico de sincronización (#30).
    **Ojo:** hasta aplicarla, «Guardar selección» en el editor de catálogo
    responde con un error explícito en vez de corromper el catálogo.

  Aplícalas en orden en un entorno de prueba y luego en producción. El SQL se
  validó con el parser de Postgres (`libpg-query`) pero **no se ha ejecutado**:
  nadie ha comprobado tipos, nombres de objetos ni permisos. Si el RPC responde
  `PGRST202`, PostgREST necesita recargar el esquema
  (`notify pgrst, 'reload schema'`). Comprobaciones sugeridas en
  `supabase/README.md`.
- [ ] **#10 · TÉC · S — Programar la purga de webhooks.** Una vez aplicada la
  `0006` (ver #9), la función `purge_processed_webhooks(retention)` existe pero
  **nadie la llama**. Prográmala con `pg_cron` si lo tienes activado (hay un
  comentario con el `cron.schedule` en la migración) o desde un job externo. Sin
  esto, `processed_webhook` sigue creciendo sin límite.
- [ ] **#11 · TÉC · M — Borrado automático por retención.** Depende de la #3. No
  existe: solo está la purga del registro técnico de webhooks. Hay que decidir
  qué se borra o anonimiza (pedidos y datos de compradores, cuentas inactivas) y
  programarlo.
- [x] **#12 · TÉC · S — ~~Índices que faltan.~~** Escritos en
  `0007_order_limits_and_indexes.sql`: `order_item_product_idx`,
  `order_catalog_created_idx` (compuesto con `created_at`, que además sirve al
  límite de frecuencia) y `business_email_idx`.
  Decisión: `business.email` lleva índice **normal, no `unique`**, porque es
  opcional y editable por el usuario y un `unique` convertiría un correo
  repetido en un error de base de datos que ninguna capa traduce (y varios
  `null` no colisionan, que es el caso ambiguo real). La consulta para detectar
  duplicados y el `create unique index ... where email is not null` quedan
  comentados en la migración. **Se aplica con la #9.**

## 4. Verificaciones nunca hechas

Todo lo de esta sección está escrito en el código pero **no se ha ejecutado**
contra servicios reales ni en un navegador.

- [ ] **#13 · VERIF · M — Paddle sandbox de punta a punta.** Contratar, cambiar
  de plan y cancelar desde Facturación. Comprobar que llega el webhook, que el
  plan se actualiza y que `paddle.subscriptions.update/cancel` funcionan con los
  parámetros usados. Comparar el precio anunciado ($19/$49/$99 USD) con el del
  último paso del checkout: de ahí sale el dato de impuestos de la #5.
- [ ] **#14 · VERIF · S — Exportar y borrar una cuenta real.** `GET
  /api/account/export` y «Borrar mi cuenta»: que el JSON traiga todo, que se
  borren los objetos de R2, que se cancele la suscripción en Paddle y que el
  usuario desaparezca de Auth. Hazlo con una cuenta de prueba.
- [ ] **#15 · VERIF · S — Teclado y foco en navegador.** Completar registro,
  pedido y pago solo con teclado. El anillo de foco de `Button` se añadió por
  código y nadie lo ha visto en pantalla.
- [ ] **#16 · VERIF · S — Lector de pantalla.** Recorrer catálogo público y
  panel con VoiceOver o NVDA; revisar los textos alternativos.
- [ ] **#17 · VERIF · S — axe o Lighthouse.** En landing, login, panel y
  catálogo. Guardar el resultado en `docs/legal/ACCESIBILIDAD.md`, que ya tiene
  los cálculos de contraste pero ninguna ejecución de herramienta.
- [ ] **#18 · VERIF · S — Pestaña Red en ventana privada.** Procedimiento de 7
  pasos en `docs/legal/AUDITORIA_SDKS.md` §6. Objetivo: confirmar que no hay
  llamadas a `fonts.googleapis.com` (las fuentes deben servirse del propio
  dominio), anotar los dominios reales del checkout de Paddle y comprobar que no
  aparece analítica.
- [ ] **#19 · VERIF · S — Revisar el aspecto de las páginas nuevas.** Las 6
  páginas legales, el pie, el logo v2 en los 5 themes y la placa azul del
  reverso sobre la sección de cierre. Nada de esto se ha visto en pantalla.
- [ ] **#20 · VERIF · S — Prueba con una persona ajena.** Que intente
  registrarse, rechazar lo opcional y cancelar la suscripción. Si duda, hay un
  patrón engañoso (punto 13 de la guía).

## 5. Seguridad

- [x] **#21 · TÉC · M — ~~Content-Security-Policy.~~** Implementada en
  `src/middleware.ts` con nonce por petición, propagado al script de theme y al
  JSON-LD. Política completa y decisiones en `docs/seguridad/CSP.md`.
  **Está en modo `Report-Only`,** así que hoy informa pero no bloquea: pasar a
  bloqueo es la #51, y depende de confirmar los dominios del checkout de Paddle
  (#13, #18). Verificado en el HTML servido: la cabecera sale, los dos scripts
  inline llevan el nonce de la cabecera y cambia en cada petición.
- [x] **#22 · TÉC · M — ~~Límite de frecuencia en `place_order`.~~** Escrito
  dentro del propio RPC en `0007`: 60 pedidos por catálogo y hora, y 5 por
  teléfono cada 10 minutos. Falla con SQLSTATE `PT429`, que el front y el
  backend traducen a un mensaje en español sin filtrar detalles de Postgres.
  No se creó tabla de intentos: un intento rechazado no se puede registrar
  porque el `raise` revierte la transacción, así que se cuentan las filas de
  `"order"` que ya existen. Ventaja: **no se guarda ningún dato personal
  nuevo**. Limitación: el RPC no recibe la IP, así que durante una inundación
  los compradores reales de ese catálogo también quedan bloqueados.
  Complementos recomendados y no hechos: Turnstile, o dejar `BACKEND_URL`
  siempre puesta para que entre el límite por IP del backend.
  **Se aplica con la #9.**
- [x] **#23 · TÉC · S — ~~Restringir `image_url` externo.~~** Ahora se exige
  `https` y se rechazan las credenciales embebidas (`https://user:pass@host`),
  en el front y en el backend. Se aplicó también a `logo_url` y `banner_url` del
  catálogo, que tenían el mismo problema. Una fila de CSV con `http://` se omite
  con el resto de filas inválidas, sin romper la importación.
  Queda la opción «mejor» (lista de dominios o proxy) sin hacer, y los datos ya
  guardados con `http://` seguirán mostrándose pero fallarán al editar: las
  consultas para detectarlos están en `docs/seguridad/CSP.md`.
- [ ] **#24 · TÉC · S — El registro de aceptación no debe perderse.** Si falla
  el insert en `legal_acceptance`, el alta continúa y el error solo queda en los
  logs del servidor, así que puede quedar un usuario sin prueba de aceptación.
  Decidir si se reintenta, se bloquea el alta o se pide aceptar de nuevo al
  entrar.

## 6. Backend Express y migración front → back

Estado actual: el backend está restaurado, pasa `tsc` y arranca. El front lo usa
**solo si `BACKEND_URL` está definida**, y entonces pasan por él: enviar pedido,
listar y cambiar estado de pedidos, y crear, editar y borrar productos y
catálogos.

- [ ] **#25 · DECIS · S — Decidir el futuro del backend.** O se completa la
  migración y se despliega, o se congela. Hoy es código que duplica lógica y no
  está en producción, así que mantener las dos rutas tiene coste.
- [ ] **#26 · TÉC · M — Endpoints que faltan para cerrar la migración.** Hoy
  siguen yendo directo a Supabase: importar CSV, imágenes de catálogo y de
  negocio, sincronizar los productos de un catálogo, todas las lecturas de
  productos y catálogos, el catálogo público, onboarding, ajustes y facturación.
  Falta incluso `GET /api/catalogs/:id`. Ojo con la paradoja: el `requireBusiness`
  del backend exige un negocio que solo el front puede crear (onboarding).
- [ ] **#27 · TÉC · S — Desduplicar lógica.** Los límites de plan están en
  `src/lib/plans.ts` y en `backend/src/config/plans.ts`, alineados solo por un
  comentario. Lo mismo con los esquemas zod (`src/lib/validation.ts` frente a
  `backend/src/schemas/*`), `MAIN_KEY_RE` y los enums. Divergirán.
- [ ] **#28 · TÉC · M — Desplegar el backend.** No tiene Dockerfile, Procfile ni
  workflow, y arranca con `tsx` sin build. No es un Worker (usa Express), así que
  necesita un host Node, `CORS_ORIGINS` con el dominio real y apuntar
  `BACKEND_URL` ahí. Depende de la #25.

## 7. Coherencia del producto

- [x] **#29 · TÉC · M — ~~`maxOrdersPerMonth` no se aplica.~~** Implementado en
  el RPC `place_order` (`0007`), con los límites en la función SQL
  `plan_max_orders_per_month`. Falla con SQLSTATE `PT402` y el comprador ve un
  mensaje que le dice que contacte al vendedor, no un error genérico.
  Decisiones: **mes calendario en UTC** y los pedidos **cancelados no cuentan**
  (cancelar un pedido falso no debe gastar cupo; la contrapartida es que el
  vendedor puede cancelar para liberar cupo, pero es un límite comercial, no una
  defensa). **Se aplica con la #9.**
- [x] **#30 · TÉC · S — ~~`syncCatalogProducts` sin transacción.~~** Ahora llama
  al RPC `sync_catalog_products` (`0008`), que hace el borrado y la inserción en
  una sola transacción, comprueba la propiedad del catálogo y de los productos,
  conserva el orden y descarta ids repetidos. Si el insert falla, el catálogo
  conserva sus productos. **Se aplica con la #9.**
- [x] **#31 · TÉC · S — ~~Errores que se tragan en silencio.~~** Las cuatro
  acciones devuelven ahora un estado `{ ok, error, message }` y la interfaz lo
  muestra; también detectan el caso de «cero filas afectadas», que antes pasaba
  por éxito. De paso, `updateCatalog`, `createProduct`, `updateProduct` e
  `importProductsCsv` registran el detalle del error de Postgres en el servidor.
  El `redirect` de `deleteCatalog` se movió al cliente, porque dentro de la
  acción el `try/catch` del componente capturaba la excepción interna de Next y
  mostraba un error en el camino de éxito.
- [x] **#32 · TÉC · S — ~~`revalidatePath` que faltan.~~** Cada mutación
  revalida ahora las rutas que toca, incluidos `/dashboard` (contadores y
  checklist) y `/c/<slug>` de los catálogos afectados. Al cambiar el slug de un
  catálogo se revalida también el anterior, porque su copia en caché seguiría
  sirviéndose. Los slugs de los catálogos donde aparece un producto se resuelven
  con una sola consulta a `catalog_product`, apoyada en un índice que ya
  existía, y solo en mutaciones de un producto concreto.
- [ ] **#33 · DECIS · S — Tablas sin usar.** `customer` y `price_list` existen en
  la base de datos (`0001_init.sql:88-108`) y ningún código las lee. Eran para
  «multi-lista de precios», que ya se quitó de los planes. Decidir si se
  implementan o se eliminan en una migración.

## 8. Licencias y marca

- [ ] **#34 · DECIS · S — Dos licencias por revisar.**
  `@img/sharp-libvips-linux-x64` es LGPL-3.0 y declara componentes MPL-2.0;
  `caniuse-lite` es CC-BY-4.0 y exige atribución. Están marcadas en
  `THIRD_PARTY_NOTICES.md`. Hay que confirmar si el despliegue en Cloudflare
  llega a empaquetar ese binario.
- [ ] **#35 · DATO · S — Confirmar la titularidad de los logos.** `CREDITS.md`
  dice que se crearon con VectorCraft según `docs/brand/README.md`, pero yo no
  puedo verificar quién es el titular. Confírmalo o corrígelo.
- [x] **#36 · DECIS · S — ~~Marcas reales en la maqueta.~~** Hecho: la vista
  previa de la landing (`PriceListPreview`, `src/app/page.tsx`) usa genéricos
  —«Refresco de cola 600 ml» (`RC-600`) y «Galletas surtidas 170 g» (`GS-170`)—
  con los mismos precios y total ($718.80). El ejemplo de CSV del `README.md`
  también. No hacía falta esperar al abogado (pregunta 16). **Siguen con marcas
  reales, fuera de mi alcance:** el placeholder de
  `dashboard/productos/product-form.tsx`, el `CSV_TEMPLATE` de
  `dashboard/productos/products-client.tsx`, `CREDITS.md` §«Marcas y ejemplos» e
  `docs/legal/INVENTARIO.md` §7.
- [ ] **#37 · DECIS · S — Licencia del propio código.** No hay `LICENSE` en el
  repo y `package.json` es `private: true`. Decide si llevará licencia.

## 9. Infraestructura y despliegue

- [ ] **#38 · TÉC · S — Crear los buckets de R2.** Uno para la caché ISR
  (`npx wrangler r2 bucket create catalii-cache`) y los tres de imágenes
  (`pnpm media:buckets`). Sin el primero falla el despliegue con ISR activado.
- [ ] **#39 · TÉC · S — Cargar los secretos del Worker.**
  `SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_API_KEY`,
  `PADDLE_NOTIFICATION_WEBHOOK_SECRET` y `PADDLE_PRODUCT_*` con
  `npx wrangler secret put`. Las `NEXT_PUBLIC_*` van en el entorno del build.
- [ ] **#40 · TÉC · S — `wrangler.jsonc` tiene marcadores `REEMPLAZAR`.** Los
  valores reales de producción no están en el repo: hay que ponerlos antes de
  desplegar.
- [ ] **#41 · TÉC · S — Servidor de imágenes.** Desplegar `media-worker`
  (`pnpm media:deploy`), conectarle un dominio (p. ej. `media.catalii.com`,
  falta `routes`/`custom_domain` en su `wrangler.jsonc`) y definir
  `NEXT_PUBLIC_MEDIA_URL` en el build. Sin eso las imágenes se sirven por
  `/api/media/...`, que pasa por el Worker de la app.
- [ ] **#42 · TÉC · S — Build command en Cloudflare.** Debe ser `pnpm cf:build`
  y el deploy `npx opennextjs-cloudflare deploy`. Si queda `next build`, el
  despliegue falla con «Could not find compiled Open Next config».
- [ ] **#43 · TÉC · S — URLs en Supabase.** Site URL y redirect URLs con
  `/auth/confirm` y `/auth/reset` del dominio real.
- [ ] **#44 · TÉC · S — Webhook de Paddle al dominio real.** Apuntar el
  notification destination a `https://TU-DOMINIO/api/webhook` con los eventos
  `customer.created/updated` y `subscription.created/updated/canceled`.
- [ ] **#45 · DATO · S — Completar el MCP de Paddle sandbox.** Ver la sección
  final de este archivo: falta pegar el bloque con tu API key de sandbox.

## 10. Documentación desactualizada

- [x] **#46 · DOC · S — ~~El README dice «magic link» y es falso.~~** Corregido:
  el acceso es correo y contraseña (`signInWithPassword`), y así lo dice ya el
  README en las dos menciones (stack y estructura).
- [x] **#47 · DOC · S — ~~Estructura del README desfasada.~~** Corregido contra
  el repo real: el árbol ya dice `src/middleware.ts` (no `proxy.ts`), lista las
  ocho migraciones (`0001`–`0008`, con nota de que `0005`–`0008` siguen sin
  aplicar) e incluye `src/lib/legal/`, `src/lib/media/`, `src/lib/backend.ts`,
  `src/types/`, `src/components/legal/`, `src/components/brand/`, `scripts/`,
  `api/uploads`, `api/media`, `api/account/export` y las seis páginas legales.
  Además se arreglaron tres afirmaciones falsas: remitía a un `.dev.vars.example`
  que no existe, decía «ver `routes` en `media-worker/wrangler.jsonc`» cuando ese
  archivo no tiene `routes` ni `custom_domain` (es la #41), y el paso 3 mandaba
  pegar solo `0001` y `0002` en el SQL Editor. El peso del bundle (~1.8 MB) se
  marcó como medición de un build anterior, no como dato actual.
- [x] **#48 · DOC · S — ~~`NOTAS-SEPARACION.md` quedó obsoleto.~~** Convertido en
  **nota histórica**: aviso arriba de que el estado actual está en `README.md` y
  en este archivo, se conserva el relato de la entrega y los «Pendientes» se
  sustituyen por una sección fechada con lo comprobado hoy: el backend sí está
  instalado y `tsc --noEmit` pasa en `backend/`; el front ya lo consume cuando
  `BACKEND_URL` está definida (`src/lib/backend.ts` + pedidos, productos y
  catálogos); y sí hay commits y remoto (`origin` en GitHub, 6 commits locales
  sin empujar), así que lo de «nada se subió a remoto» tampoco era cierto.
  Nota: por eso la #1 de este archivo también está desfasada (dice ~65 archivos
  sin commit; hoy el historial está commiteado).
- [x] **#49 · DOC · S — ~~`docs/legal/DIAGNOSTICO.md` arrastra una tabla
  vieja.~~** Reorganizado sin perder historial: aviso destacado al principio con
  una tabla de vigencia sección por sección y enlaces internos al estado vigente;
  el «Resumen de conteo», la «Tabla de diagnóstico», el cálculo de contraste y
  los dos planes de trabajo quedan marcados como **HISTÓRICO (Fase 2)** con una
  nota de qué los reemplaza (el contraste remite a `ACCESIBILIDAD.md`, que ya
  tiene los cinco themes recalculados); se añadió al final una actualización
  fechada por la #36. No se cambió ningún estado: los vigentes siguen siendo los
  de «Estado tras la Fase 3» y sus actualizaciones.

## 11. Calidad

- [ ] **#50 · TÉC · M — No hay ni un test ni CI.** No existe runner,
  configuración ni workflow. Con pagos, RLS y borrado de cuentas en juego, al
  menos las piezas críticas (RPC `place_order`, límites de plan, webhook de
  Paddle) merecerían pruebas. Decide el alcance: no lo añado por mi cuenta.

---

## MCP de Paddle: estado

Configurado en `.kiro/settings/mcp.json` (ámbito del workspace):

| Servidor | URL | Estado | Autenticación |
|---|---|---|---|
| `paddle-docs` | `https://paddlehq.mcp.kapa.ai` | activo | ninguna; en el primer uso pide entrar con Google o GitHub |
| `paddle-live` | `https://mcp.paddle.com/mcp` | **desactivado** | OAuth en el navegador |
| `paddle-sandbox` | `https://sandbox-mcp.paddle.com/mcp` | **falta** | API key de sandbox como Bearer |

**Para activar el de sandbox (#45):** el servidor de sandbox solo admite API
key, y una regla de permisos me impide escribir `mcp.json`, así que añade tú este
bloque dentro de `mcpServers`:

```json
"paddle-sandbox": {
  "url": "https://sandbox-mcp.paddle.com/mcp",
  "headers": { "Authorization": "Bearer ${PADDLE_API_KEY_SANDBOX}" }
}
```

Y exporta la clave en tu shell antes de abrir Kiro (fish):

```fish
set -Ux PADDLE_API_KEY_SANDBOX "pdl_sdbx_apikey_..."
```

Se usa `${...}` a propósito: así la clave no queda escrita en un archivo del
repo. La creas en Paddle → Developer tools → Authentication
(`https://sandbox-vendors.paddle.com/authentication-v2`).

**Para activar el de producción:** cambia `"disabled": true` a `false` en
`paddle-live`. Usa OAuth, así que no hace falta clave: la primera vez abre el
navegador para autorizar. Por defecto queda en solo lectura según el rol de tu
usuario, y los permisos se gestionan en Paddle → Connectors → MCP. Lo dejé
desactivado porque apunta a tu cuenta real de cobros.

## 12. Nuevas (salieron al resolver las anteriores)

- [ ] **#51 · DECIS · S — Pasar la CSP a modo bloqueo.** Hoy se envía como
  `Content-Security-Policy-Report-Only`, así que el navegador informa de las
  violaciones pero **no bloquea nada**: es telemetría, no una defensa. La
  protección real llega al compilar con `CSP_MODE=enforce`. Antes hay que
  confirmar en la pestaña Red (#18) y en el checkout de sandbox (#13) los
  dominios que usa el overlay de Paddle, porque ahora están cubiertos con un
  comodín `https://*.paddle.com` que convendría sustituir por la lista exacta.
  Si falta un dominio, en modo bloqueo el pago no abre. Procedimiento en
  `docs/seguridad/CSP.md`.
- [ ] **#52 · DECIS · S — El nonce volvió dinámicas todas las páginas.** La CSP
  con nonce por petición obliga a leer `headers()` en el layout raíz, así que la
  landing y las seis páginas legales, que antes eran estáticas, ahora se
  renderizan en cada visita (`next build` las marca con `ƒ`). Es inherente al
  patrón: los scripts inline que Next genera para el streaming también
  necesitan el nonce, y un HTML cacheado llevaría uno caducado. No son páginas
  con datos de usuario, así que el coste es CPU de Worker por visita, no
  consultas. Decide: aceptarlo, o renunciar al `script-src` estricto (con
  `'unsafe-inline'`) para recuperar el HTML estático. Yo lo dejé en lo seguro.
  Nota aparte: `/c/[slug]` y el panel **ya eran dinámicos antes** de esto,
  porque `createClient()` usa `cookies()`; el `revalidate = 60` del catálogo
  público no tenía efecto, y eso no se ha tocado.
- [ ] **#53 · TÉC · S — Mostrar el motivo de las filas omitidas al importar
  CSV.** `importProductsCsv` cuenta las filas inválidas pero descarta el mensaje
  de error, así que el usuario ve «2 omitidos» sin saber por qué (ahora, por
  ejemplo, porque la URL de imagen no es `https`). Acumular el primer motivo por
  fila sería suficiente.
- [ ] **#54 · TÉC · S — El webhook de Paddle no avisa si hay correos
  duplicados.** `process-webhook.ts` busca el negocio por correo con
  `.maybeSingle()`: si dos negocios comparten correo, Supabase devuelve error,
  `business_id` queda en `null` y el plan no se actualiza, **sin que nadie se
  entere**. El índice de la #12 no arregla esto. Como mínimo, registrar el
  error.
- [ ] **#55 · TÉC · S — El aviso de `middleware` obsoleto de Next 16.** El build
  avisa: «The "middleware" file convention is deprecated. Please use "proxy"
  instead». Renombrar afecta al despliegue en Workers (el README explica que se
  usa `middleware.ts` justamente porque OpenNext no soportaba `proxy.ts` en
  Node), así que hay que comprobar si ya lo soporta antes de tocarlo.
