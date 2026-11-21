# Catalii Backend (Node + Express)

API en Node.js + Express + TypeScript. Habla con la **misma** base de datos de
Supabase que el front, respetando RLS: valida el access token del usuario y
hace las consultas en su nombre, así que no puede ver ni tocar datos de otro
negocio.

Es un servicio aparte del front Next.js. La idea es que el front vaya migrando
a consumir esta API poco a poco, sin tumbar lo que ya funciona en Cloudflare.

Además es el **único sitio donde vive MongoDB**: la analítica de visitas y
clics se guarda ahí, y el motivo de que sea aquí y no en el Worker está en
[Analítica (MongoDB)](#analítica-mongodb).

## Requisitos

- Node.js 20+
- pnpm
- Un proyecto de Supabase (el mismo del front)
- Un cluster de MongoDB (**opcional**: sin él todo funciona menos la analítica)

## Puesta en marcha

```bash
cd backend
cp .env.example .env   # y completa las claves
pnpm install --ignore-workspace
pnpm dev               # http://localhost:8787
```

## Variables de entorno

| Variable | Para qué |
|----------|----------|
| `PORT` | Puerto del server (por defecto 8787) |
| `NODE_ENV` | development / production |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave anon: valida el token y aplica RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service_role: solo tareas de servidor |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma |
| `MONGODB_URI` | **Opcional.** Cluster de la analítica. Vacía = analítica desactivada |
| `MONGODB_DB` | Base dentro del cluster (por defecto `catalii`) |
| `METRICS_RETENTION_DAYS` | Días que se guardan los eventos (por defecto 180) |
| `ADMIN_EMAILS` | Correos con acceso a las métricas globales, separados por coma |

### Por qué `MONGODB_URI` NO es obligatoria

El resto de las variables hacen `process.exit(1)` si faltan, porque sin
Supabase este servicio no puede responder nada. Con Mongo es distinto: solo
sirve a la analítica. Si fuera obligatoria, un backend sin cluster no
arrancaría y un cluster caído impediría desplegar, es decir, **las visitas
tumbarían los pedidos**. Así que es opcional y el arranque lo deja claro en el
log:

```
[mongo] MONGODB_URI vacía: la analítica está DESACTIVADA (POST /api/metrics/events
descarta los eventos y GET /api/metrics/* responde 503). Define MONGODB_URI cuando
el cluster exista.
```

Con URI pero sin cluster accesible, el aviso es el mismo en espíritu y se
reintenta cada 30 segundos:

```
[mongo] SIN CONEXIÓN (…). La analítica queda desactivada: los eventos se descartan
y /api/metrics/* responde 503. El resto del backend funciona normal.
```

`ADMIN_EMAILS` vacío es legítimo (aún no hay administradores) pero también se
avisa al arrancar: con la lista vacía, `GET /api/metrics/summary` responde 404
a todo el mundo.

## Scripts

| Script | Qué hace |
|--------|----------|
| `pnpm dev` | Arranca con recarga en caliente (tsx watch) |
| `pnpm start` | Arranca el server con tsx (desarrollo) |
| `pnpm build` | Compila a `dist/` (tsc) y reescribe el alias `@/*` (tsc-alias) |
| `pnpm serve` | Arranca lo compilado: `node dist/server.js` (es lo que usa Docker) |
| `pnpm typecheck` | Chequeo de tipos sin emitir |
| `pnpm check:metrics` | Verifica índices y pipelines contra un MongoDB en memoria |

`pnpm install` en este directorio necesita `--ignore-workspace`: el
`pnpm-workspace.yaml` de la raíz del repo no incluye `backend/` y sin esa
bandera pnpm intenta resolver el workspace entero.

## Autenticación

Las rutas del panel esperan el header:

```
Authorization: Bearer <access_token_de_supabase>
```

El token se valida contra Supabase Auth en cada petición (no se confía en el
JWT a ciegas) y las consultas corren con RLS como ese usuario.

### Administración

Las métricas globales exigen además que el correo del usuario esté en
`ADMIN_EMAILS` (`requireAdmin`, en `middlewares/auth.ts`). Dos decisiones:

- La lista vive en una **variable de entorno**, no en la base de datos: no hay
  tabla que un fallo de RLS pueda exponer o modificar, y dar o quitar acceso es
  un cambio de configuración. Es la misma lista que usa el panel del front.
- Si hay sesión pero no es administrador, la respuesta es **404, no 403**, con
  el mismo cuerpo que una ruta inexistente. Un 403 confirmaría que la ruta
  existe a cualquiera que la pruebe.

`GET /api/metrics/business/:businessId` acepta además al **dueño** de ese
negocio. La propiedad se comprueba con el cliente del usuario (RLS) y filtrando
por `owner_id`: la política pública de `business` deja a cualquier usuario leer
los negocios publicados, así que ver la fila no demuestra ser el dueño.

## Endpoints

| Método | Ruta | Auth | Qué hace |
|--------|------|------|----------|
| GET | `/health` | — | Estado del servicio |
| GET | `/api/products` | sí | Lista productos del negocio |
| POST | `/api/products` | sí | Crea producto (gating por plan) |
| GET | `/api/products/:id` | sí | Un producto |
| PATCH | `/api/products/:id` | sí | Edita producto |
| DELETE | `/api/products/:id` | sí | Borra producto; devuelve `{ images }` para limpiar R2 |
| GET | `/api/catalogs` | sí | Lista catálogos |
| POST | `/api/catalogs` | sí | Crea catálogo (gating por plan) |
| PATCH | `/api/catalogs/:id` | sí | Edita catálogo |
| DELETE | `/api/catalogs/:id` | sí | Borra catálogo; devuelve `{ logo_key, banner_key }` |
| GET | `/api/storefront/:slug` | — | Catálogo público + productos |
| POST | `/api/orders` | — | Enviar pedido (recalcula precios en BD) |
| GET | `/api/orders` | sí | Lista pedidos del negocio |
| PATCH | `/api/orders/:id/status` | sí | Cambia el estado de un pedido |
| POST | `/api/metrics/events` | — | Registra una visita o un clic (beacon, 204 siempre) |
| GET | `/api/metrics/summary` | admin | Resumen global de métricas |
| GET | `/api/metrics/business/:businessId` | admin o dueño | Métricas de un negocio |

En los `PATCH`, un campo de texto opcional (`sku`, `description`, `category`,
`image_url`, `display_name`, `whatsapp`, `theme`...) se **vacía** enviando `""`
o `null`; si no se envía, no se toca.

Respuestas: `{ "data": ... }` en éxito, `{ "error": { "code", "message" } }`
en error. Las métricas no son la excepción: el resumen va dentro de `data`,
que es lo que desenvuelve `backendFetch()` en el front.

## Analítica (MongoDB)

El contrato con el panel está en [`docs/METRICAS-API.md`](../docs/METRICAS-API.md).
Aquí va el lado del servidor.

### Por qué Mongo está aquí y no en el Worker

El driver de MongoDB funciona en Cloudflare Workers, pero
[la propia documentación de Cloudflare](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/)
advierte que cada invocación abre una conexión TCP y TLS nueva —unos **300 ms**
de sobrecarga— y que Hyperdrive no soporta Mongo. Este backend es Node: abre
**un solo cliente para todo el proceso** y reparte las peticiones por su pool,
así que ese coste se paga una vez. Esa es toda la razón de que la analítica viva
en Express mientras el resto del front sigue en Workers.

Como contrapartida, el evento hace un salto más (navegador → Worker → backend).
Se mantiene a propósito: el beacon va al mismo origen del front, no hay que
tocar CORS ni la CSP, y el navegador recibe su 204 sin esperar al backend.

### Modelo de datos

Un documento por evento en la colección `events` de la base `MONGODB_DB`
(tipos en `src/types/metrics.ts`):

```jsonc
{
  "_id": "ObjectId",
  "kind": "catalog_view",        // business_view | catalog_view | whatsapp_click
  "businessId": "uuid",
  "businessSlug": "enermo",
  "catalogId": "uuid | null",
  "catalogSlug": "verano | null",
  "at": "ISODate",
  "country": "EC | null",                  // cabecera CF-IPCountry
  "referrerHost": "instagram.com | null",  // solo el host
  "device": "mobile | desktop | null"
}
```

**Lo que NO se guarda:** IP, user agent completo, identificador de visitante,
cookies ni la URL del referrer. Del user agent solo se deduce `mobile`/
`desktop`; del referrer solo el host, porque una URL completa puede llevar
términos de búsqueda o identificadores en la query. Por eso esto no añade datos
personales al inventario: no permite reconstruir el comportamiento de una
persona. La contrapartida aceptada es que no hay visitantes únicos, solo
visitas, y el panel debe decirlo.

`order_sent` no se acepta como `kind`: ese dato ya vive en la tabla `order` de
Supabase y aceptarlo aquí dejaría que cualquiera inflara los pedidos del panel.

### Índices y retención

Se crean al arrancar con `createIndexes` (idempotente) y un fallo no bloquea el
arranque, solo deja un aviso en el log:

| Índice | Para qué |
|---|---|
| `{ at: 1 }` con `expireAfterSeconds` (`events_at_ttl`) | Retención automática |
| `{ businessId: 1, at: -1 }` (`events_business_at`) | Métricas de un negocio |
| `{ kind: 1, at: -1 }` (`events_kind_at`) | Series del panel |

La retención sale de `METRICS_RETENTION_DAYS` (180 por defecto): el TTL de
MongoDB borra los eventos viejos solo, sin cron ni proceso externo. Si se cambia
el valor, el índice ya existe con otro `expireAfterSeconds` y Mongo responde
conflicto de opciones: el arranque lo detecta y lo ajusta con `collMod` en vez
de borrar y recrear el índice.

### Escritura

`POST /api/metrics/events` responde **204 siempre**: con datos inválidos, con un
slug que no existe, con Mongo caído y también al pasarse de su rate limit (60
eventos cada 5 minutos por IP, más estricto que el límite general). Es un
beacon: nadie lee la respuesta y un 4xx solo ensuciaría la consola del
comprador. Se responde **antes** de tocar Supabase y Mongo, y la escritura
sigue en segundo plano, para que contar una visita no retrase a quien compra.

El slug se resuelve a `businessId`/`catalogId` con el **cliente anónimo** de
Supabase, así que RLS solo deja ver catálogos y negocios públicos; lo que no
resuelve se descarta en silencio y la respuesta no cambia (el endpoint no sirve
para enumerar negocios). El mapeo se cachea en memoria 5 minutos (y 1 minuto los
fallos, para que un bot golpeando slugs inexistentes no se convierta en una
consulta por evento).

Una excepción explicada en el código: el *slug* del negocio dueño de un catálogo
se lee con el cliente de servicio, porque la página del negocio arranca
despublicada (`business.is_public` por defecto `false`) y el cliente anónimo no
podría leerlo; que el catálogo sea público ya lo comprobó RLS justo antes, y ese
slug nunca sale al navegador.

### Lectura

Los resúmenes se calculan con **pipelines de agregación** (`$match`, `$group`,
`$facet`, `$sort`, `$top`), no trayendo documentos y sumando en JavaScript: un
`$facet` resuelve los cuatro desgloses con el mismo `$match` y una sola pasada
por el índice. Los días se agrupan en **UTC** con `$dateTrunc`. Lo único que se
hace en JS es rellenar con ceros los días sin eventos, porque un día que no
existe no puede salir de un `$group`.

Si Mongo no está disponible, las lecturas responden **503**
(`metrics_unavailable`): a diferencia de la escritura, aquí no se pueden
inventar datos.

### Comportamiento sin Mongo (es el caso normal hasta que exista el cluster)

| Qué | Pasa esto |
|---|---|
| Arranque | Avisa en el log y sigue; nunca `exit(1)` |
| `/health` | 200 con `"mongo": { "enabled": …, "connected": false }` |
| `POST /api/metrics/events` | 204, evento descartado |
| `GET /api/metrics/*` | 503 `metrics_unavailable` |
| Productos, catálogos, pedidos | Igual que siempre |

### Verificar los pipelines sin cluster

```bash
cd backend && pnpm check:metrics
```

Levanta un `mongod` en memoria (`mongodb-memory-server` descarga el binario la
primera vez), crea los índices, escribe eventos y comprueba los números de
`summary()` y `forBusiness()`, el ajuste del TTL y que el `$match` entre por el
índice del negocio.

## CORS

El navegador **nunca** llama a este backend:

- El beacon va a `/api/metric` del Worker (mismo origen) y el Worker reenvía al
  backend desde el servidor.
- El panel usa `backendFetch()`, que corre en el servidor de Next.

Esas peticiones no llevan cabecera `Origin`, y el middleware ya permite las
peticiones sin `Origin` (si no, se rompería también el monitoreo). Por eso
`/api/metrics/*` **no necesita que se abra CORS**.

En producción, `CORS_ORIGINS` se queda con los dominios del front como defensa
en profundidad, por si algún día alguna llamada pasa a hacerse desde el
navegador:

```
CORS_ORIGINS=https://catalii.com,https://www.catalii.com
```

Si se añade un origen nuevo y se olvida meterlo ahí, el error de CORS sale como
500 del manejador central (el middleware `cors` lanza). Es ruidoso, pero avisa.

## Despliegue (`back.catalii.com`)

No es un Worker: usa Express y un pool de conexiones, así que necesita un host
Node (Fly.io, Railway, Render, un VPS con Docker…).

### Imagen

El `Dockerfile` es multi-stage:

1. **builder**: instala dependencias con el lockfile, compila a `dist/` con
   `pnpm build` y luego hace `pnpm prune --prod`.
2. **runner**: `NODE_ENV=production`, usuario `node` (sin privilegios), solo
   `dist/` y las dependencias de producción. Ni TypeScript, ni `tsx`, ni el
   código fuente. El `CMD` es `node dist/server.js` directo, sin npm/pnpm por
   medio, para que el proceso reciba `SIGTERM` y cierre el pool de Mongo
   ordenadamente.

```bash
docker build -t catalii-backend ./backend
docker run --rm -p 8787:8787 --env-file backend/.env catalii-backend
```

El build necesita `--ignore-workspace` (ya está en el Dockerfile) porque el
`pnpm-workspace.yaml` de la raíz no viaja a la imagen.

### Pasos

1. Desplegar la imagen en el host y publicarla en `back.catalii.com` con TLS
   (lo normal: proxy del host o Cloudflare delante en modo *proxied*).
2. Variables **requeridas**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`, `NODE_ENV=production`.
   Recomendadas: `MONGODB_URI`, `MONGODB_DB`, `METRICS_RETENTION_DAYS`,
   `ADMIN_EMAILS`. `PORT` lo suele inyectar el host.
3. En el cluster de Mongo (Atlas), permitir la IP de salida del backend y crear
   un usuario con permiso solo sobre la base `MONGODB_DB`.
4. En el front, apuntar `BACKEND_URL=https://back.catalii.com`.

### Chequeo de salud

```bash
curl https://back.catalii.com/health
```

```jsonc
{ "ok": true, "service": "catalii-backend", "uptime": 42,
  "time": "2026-11-21T12:00:00.000Z",
  "mongo": { "enabled": true, "connected": true } }
```

`ok` es `true` aunque Mongo esté caído, y el `HEALTHCHECK` del contenedor
tampoco mira Mongo: reiniciar el servicio por una analítica caída dejaría al
negocio sin pedidos. Para vigilar la analítica, alerta sobre
`mongo.connected === false`. El endpoint no publica la URI, ni el host, ni el
nombre de la base: solo si está configurado y si responde.

## Estructura

```
src/
├── config/        env y planes
├── controllers/   traducen HTTP <-> servicios
├── middlewares/   auth, validación, errores, seguridad
├── routes/        definición de rutas
├── schemas/       esquemas zod de entrada
├── services/      acceso a datos (Supabase y MongoDB)
├── lib/           supabase, mongo, caché con TTL, errores
├── types/         tipos de dominio, métricas y http
├── app.ts         arma la app de Express
└── server.ts      levanta el servidor y conecta Mongo
scripts/
└── check-metrics.ts   verifica índices y pipelines con un Mongo en memoria
```
