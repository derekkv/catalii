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
- Nada de esto está empezado salvo donde diga lo contrario.

## Empieza por aquí (en este orden)

1. **#1** proteger el trabajo con commits.
2. **#2–#8** los datos legales: desbloquean el lanzamiento de las páginas.
3. **#9–#10** aplicar las dos migraciones en un entorno de prueba.
4. **#13–#16** probar con Paddle sandbox y con una cuenta real lo que ya está escrito pero nunca se ejecutó.
5. **#21–#23** seguridad: CSP, límite de pedidos e imágenes externas.

---

## 1. Control de versiones

- [ ] **#1 · TÉC · S — Commitear y subir el trabajo.** Hay ~65 archivos sin
  commit en `main` y, según `NOTAS-SEPARACION.md`, nunca se hizo `git push`.
  Agrupación sugerida: (a) backend restaurado + typecheck, (b) front consume el
  back, (c) legal y textos, (d) accesibilidad y licencias, (e) marca y logos v2.
  Riesgo real de perder todo lo hecho.

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

- [ ] **#9 · TÉC · S — Aplicar `0005_legal_acceptance.sql`.** Está escrita y sin
  ejecutar. Sin ella, el registro de aceptación de términos falla en silencio y
  no hay prueba de quién aceptó qué. Primero en un entorno de prueba.
- [ ] **#10 · TÉC · S — Aplicar `0006_purge_processed_webhooks.sql`.** Crea
  `purge_processed_webhooks(retention)`, que hoy nadie ejecuta: `processed_webhook`
  crece sin límite. Si activas `pg_cron`, prográmala (ver comentario en la
  migración); si no, llámala a mano o desde un job externo.
- [ ] **#11 · TÉC · M — Borrado automático por retención.** Depende de la #3. No
  existe: solo está la purga del registro técnico de webhooks. Hay que decidir
  qué se borra o anonimiza (pedidos y datos de compradores, cuentas inactivas) y
  programarlo.
- [ ] **#12 · TÉC · S — Índices que faltan.** `order_item(product_id)` y
  `order(catalog_id)` son claves `on delete set null` sin índice
  (`0001_init.sql:135,113`): cada borrado de producto o catálogo recorre la tabla
  completa. Y `business(email)` no tiene índice ni `UNIQUE`
  (`0001_init.sql:14-27`) aunque es la clave con la que el webhook de Paddle
  encuentra el negocio.

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

- [ ] **#21 · TÉC · M — Content-Security-Policy.** No existe
  (`next.config.ts:4-17` tiene HSTS, nosniff, X-Frame-Options y
  Permissions-Policy, pero no CSP). Hace falta nonce para el JSON-LD de
  `c/[slug]/page.tsx` y para `theme-script.tsx`. Es la segunda línea contra XSS
  y lo único que limitaría las imágenes de terceros de la #23.
- [ ] **#22 · TÉC · M — Límite de frecuencia en `place_order`.** El backend
  Express tiene `placeOrderLimiter` (20 cada 10 min), pero el camino por defecto
  (`BACKEND_URL` vacío) va al RPC directo, concedido a `anon` sin límite
  (`0002_rls_and_rpc.sql:201`). Es el único endpoint escribible sin sesión:
  cualquiera puede inundar de pedidos falsos un catálogo público. Opciones:
  contador por IP o teléfono dentro del RPC, Turnstile, o dejar `BACKEND_URL`
  siempre configurada.
- [ ] **#23 · TÉC · S — Restringir `image_url` externo.** `validation.ts:38`
  acepta cualquier URL, incluida `http://`, y se renderiza como `src` en el
  catálogo público (`lib/media/config.ts:154`): el navegador del comprador
  revela su IP a un host arbitrario y puede romper HTTPS por contenido mixto.
  Mínimo: exigir `https`. Mejor: lista de dominios o proxy.
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

- [ ] **#29 · TÉC · M — `maxOrdersPerMonth` no se aplica.** Está definido
  (`plans.ts:16,29`), duplicado en el backend y **anunciado como «20 pedidos/mes»**
  en el plan gratis, pero nadie lo comprueba: ni el RPC cuenta pedidos. O se
  implementa o se quita de lo que se promete.
- [ ] **#30 · TÉC · S — `syncCatalogProducts` sin transacción.** Borra todas las
  filas de `catalog_product` y luego inserta, sin comprobar errores
  (`catalogos/actions.ts`): si falla el insert, el catálogo se queda vacío. Y no
  revalida `/c/[slug]`, así que el cambio no se ve en el catálogo público.
- [ ] **#31 · TÉC · S — Errores que se tragan en silencio.**
  `deleteProduct`, `updateOrderStatus`, `deleteCatalog` y `syncCatalogProducts`
  devuelven `void` y no informan al usuario si la operación falla: parece que
  funcionó.
- [ ] **#32 · TÉC · S — `revalidatePath` que faltan.** Tras varias mutaciones no
  se revalida `/c/[slug]` ni `/dashboard`, así que el catálogo público puede
  seguir mostrando datos viejos hasta que caduque el ISR.
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
- [ ] **#36 · DECIS · S — Marcas reales en la maqueta.** La landing usa
  «Coca-Cola 600 ml» y «Galleta María» como ejemplo. Cambiarlas por genéricos es
  trivial; hazlo si tu abogado lo pide (pregunta 16 del resumen).
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
- [ ] **#47 · DOC · S — Estructura del README desfasada.** Menciona `proxy.ts`
  (hoy es `src/middleware.ts`), lista solo dos migraciones (hay seis) y no
  refleja los archivos nuevos (`src/lib/legal/`, `src/lib/backend.ts`,
  `scripts/`, `src/components/legal/`).
- [ ] **#48 · DOC · S — `NOTAS-SEPARACION.md` quedó obsoleto.** Dice que el
  backend «aún no está instalado ni type-chequeado» y que el front no lo
  consume: ambas cosas ya cambiaron. Actualízalo o archívalo.
- [ ] **#49 · DOC · S — `docs/legal/DIAGNOSTICO.md` arrastra una tabla vieja.**
  La tabla de la Fase 2 está desfasada; el estado real está en las dos
  actualizaciones del final. Quien lo lea sin llegar al final se confunde.

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
