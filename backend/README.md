# Catalii Backend (Node + Express)

API en Node.js + Express + TypeScript. Habla con la **misma** base de datos de
Supabase que el front, respetando RLS: valida el access token del usuario y
hace las consultas en su nombre, así que no puede ver ni tocar datos de otro
negocio.

Es un servicio aparte del front Next.js. La idea es que el front vaya migrando
a consumir esta API poco a poco, sin tumbar lo que ya funciona en Cloudflare.

## Requisitos

- Node.js 20+
- pnpm
- Un proyecto de Supabase (el mismo del front)

## Puesta en marcha

```bash
cd backend
cp .env.example .env   # y completa las claves
pnpm install
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

## Scripts

| Script | Qué hace |
|--------|----------|
| `pnpm dev` | Arranca con recarga en caliente (tsx watch) |
| `pnpm start` | Arranca el server |
| `pnpm typecheck` | Chequeo de tipos sin emitir |

## Autenticación

Las rutas del panel esperan el header:

```
Authorization: Bearer <access_token_de_supabase>
```

El token se valida contra Supabase Auth en cada petición (no se confía en el
JWT a ciegas) y las consultas corren con RLS como ese usuario.

## Endpoints

| Método | Ruta | Auth | Qué hace |
|--------|------|------|----------|
| GET | `/health` | — | Estado del servicio |
| GET | `/api/products` | sí | Lista productos del negocio |
| POST | `/api/products` | sí | Crea producto (gating por plan) |
| GET | `/api/products/:id` | sí | Un producto |
| PATCH | `/api/products/:id` | sí | Edita producto |
| DELETE | `/api/products/:id` | sí | Borra producto |
| GET | `/api/catalogs` | sí | Lista catálogos |
| POST | `/api/catalogs` | sí | Crea catálogo (gating por plan) |
| PATCH | `/api/catalogs/:id` | sí | Edita catálogo |
| DELETE | `/api/catalogs/:id` | sí | Borra catálogo |
| GET | `/api/storefront/:slug` | — | Catálogo público + productos |
| POST | `/api/orders` | — | Enviar pedido (recalcula precios en BD) |
| GET | `/api/orders` | sí | Lista pedidos del negocio |
| PATCH | `/api/orders/:id/status` | sí | Cambia el estado de un pedido |

Respuestas: `{ "data": ... }` en éxito, `{ "error": { "code", "message" } }`
en error.

## Estructura

```
src/
├── config/        env y planes
├── controllers/   traducen HTTP <-> servicios
├── middlewares/   auth, validación, errores, seguridad
├── routes/        definición de rutas
├── schemas/       esquemas zod de entrada
├── services/      acceso a datos (Supabase)
├── lib/           supabase, errores
├── types/         tipos de dominio y http
├── app.ts         arma la app de Express
└── server.ts      levanta el servidor
```
