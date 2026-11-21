# API de métricas (backend Express + MongoDB)

Contrato entre el front (Cloudflare Workers) y el backend (`back.catalii.com`).
Lo usan el navegador del comprador para registrar eventos y el panel de
administración para leerlos.

## Por qué el backend y no el Worker

El driver de MongoDB **funciona** en Workers, pero [la documentación de
Cloudflare](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/)
advierte que cada invocación abre una conexión TCP y TLS nueva, con unos
**300 ms de sobrecarga**, y que Hyperdrive no soporta Mongo. El backend es
Node, mantiene un pool de conexiones y no paga ese coste.

## Qué se guarda

Un documento por evento en la colección `events`:

```jsonc
{
  "_id": "ObjectId",
  "kind": "catalog_view",        // business_view | catalog_view | whatsapp_click
  "businessId": "uuid",          // resuelto desde el slug al recibir el evento
  "businessSlug": "enermo",
  "catalogId": "uuid | null",
  "catalogSlug": "verano | null",
  "at": "ISODate",               // índice TTL
  "country": "EC | null",        // cabecera CF-IPCountry
  "referrerHost": "instagram.com | null",  // solo el host, nunca la URL completa
  "device": "mobile | desktop | null"
}
```

**Sin IP, sin user agent completo, sin identificador de visitante y sin
cookies.** Por eso esto no añade datos personales al inventario: no permite
reconstruir el comportamiento de una persona. La contrapartida es que no hay
visitantes únicos; el panel debe decirlo.

Índices obligatorios:

| Índice | Para qué |
|---|---|
| `{ at: 1 }` con `expireAfterSeconds` | Retención automática (borra lo viejo sin cron) |
| `{ businessId: 1, at: -1 }` | Métricas de un negocio |
| `{ kind: 1, at: -1 }` | Series del panel |

## Endpoints

### `POST /api/metrics/events` — público

Lo llama el navegador (a través del Worker). Cuerpo:

```jsonc
{ "kind": "catalog_view", "catalogSlug": "verano", "businessSlug": null,
  "referrerHost": "instagram.com", "device": "mobile" }
```

Reglas:
- **Responde `204` siempre**, también con datos inválidos o con Mongo caído. Es
  un beacon: nadie escucha la respuesta y un 4xx solo ensuciaría la consola.
- **No devuelve nada del negocio.** Escritura ciega: no confirma si el slug
  existe, así que no sirve para enumerar negocios.
- `kind` se valida contra la lista. `order_sent` **se rechaza**: ese dato ya
  vive en la tabla `order` y aceptarlo dejaría inflar los pedidos del panel.
- El slug se resuelve a `businessId`/`catalogId` comprobando en Supabase que
  sea **público**; si no lo es, se descarta. Con caché en memoria del mapeo
  para no consultar en cada evento.
- Rate limit propio, más estricto que el general: 60 eventos cada 5 minutos por
  IP. Al pasarse responde 204 igual y descarta el evento, no 429.
- El servidor completa el resto: `country` sale de `CF-IPCountry`, y si el
  cliente no los manda, `referrerHost` sale de la cabecera `Referer` reducida al
  host y `device` de la cabecera `User-Agent` (solo `mobile`/`desktop`; el user
  agent no se guarda). Si el cliente manda una URL completa en `referrerHost`,
  el servidor se queda solo con el host.

### `GET /api/metrics/summary?days=30` — solo administradores

La carga útil va dentro de `data`, como en el resto de la API del backend (es
lo que desenvuelve `backendFetch()` en el front):

```jsonc
{ "data": {
  "days": 30,
  "totals": { "business_view": 120, "catalog_view": 940, "whatsapp_click": 76 },
  "series": [{ "day": "2026-11-21", "business_view": 4, "catalog_view": 31, "whatsapp_click": 2 }],
  "byBusiness": [{ "businessId": "uuid", "businessSlug": "enermo",
                   "business_view": 10, "catalog_view": 120, "whatsapp_click": 9 }],
  "byCountry": [{ "country": "EC", "count": 812 }]
} }
```

`days` acepta 1-365 (por defecto 30); fuera de rango responde 400. `series`
trae siempre `days` elementos, en orden y con los días vacíos a cero.
`byBusiness` y `byCountry` vienen ordenados por volumen y topados a 50 filas.
`businessSlug` puede ser `null` si el negocio se borró después del evento.

### `GET /api/metrics/business/:businessId?days=30` — administrador o dueño

Mismo formato, acotado a un negocio: `days`, `businessId`, `totals`, `series` y
`byCatalog` (con `catalogId: null` para los eventos de la página del negocio,
que no pertenecen a ningún catálogo), todo dentro de `data`.

Si el usuario no es administrador ni dueño de ese negocio, la respuesta es
**404**, igual que si el id no fuera un uuid.

### Cuando la analítica no está disponible

Si no hay cluster de Mongo configurado o no responde, las dos rutas de lectura
responden **503** con `{ "error": { "code": "metrics_unavailable", … } }`. El
panel debería mostrar «sin datos por ahora», no un error roto. La escritura, en
cambio, sigue devolviendo 204 y descarta el evento.

Los días se calculan en **UTC** y la serie incluye los días sin eventos a cero,
para que el gráfico no tenga huecos.

## Autenticación

| Endpoint | Quién |
|---|---|
| `POST /api/metrics/events` | cualquiera, sin sesión |
| `GET /api/metrics/*` | `Authorization: Bearer <access token de Supabase>`; el backend revalida el token contra Auth y, para las rutas de administración, comprueba el correo contra su propia `ADMIN_EMAILS` |

El front nunca manda un secreto compartido: reutiliza el token del
administrador que está viendo el panel.

## Camino del evento

```
navegador ──sendBeacon──> /api/metric (Worker, mismo origen)
                              └── reenvía ──> back.catalii.com/api/metrics/events
```

Se mantiene el salto por el Worker a propósito: así el beacon va al mismo
origen y no hay que tocar CORS ni la `connect-src` de la CSP, y el navegador
recibe su 204 sin esperar al backend (`waitUntil`). Si el backend no responde,
se pierde el evento y no pasa nada más.
