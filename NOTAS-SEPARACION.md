# Separación front / back / supabase — notas de entrega

> ⚠️ **Documento histórico.** Describe la entrega de la separación
> front/back/supabase tal como quedó en noviembre de 2026. **El estado actual
> está en [`README.md`](./README.md) (cómo funciona hoy) y en
> [`PENDIENTES.md`](./PENDIENTES.md) (lo que falta).** No añadas pendientes
> aquí: van a `PENDIENTES.md`, que es la lista única y numerada.
>
> Lo que decía la sección «Pendientes» de este archivo ya no es cierto; al
> final hay una nota fechada con las correcciones y dónde está cada cosa hoy.

## Qué se hizo (18 commits)

### Backend — 8 commits (`backend/`, Node + Express + TypeScript)
Servicio aparte que habla con la **misma** Supabase respetando RLS.

- Arrancando el backend con node y express, estructura base
- Conexion a supabase y middleware de auth en el back
- Rutas de productos en el back, crear, editar, borrar y limites por plan
- Catalogos en el back y el catalogo publico para los clientes
- Pedidos en el back, enviar pedido y cambiar el estado
- Validaciones con zod y manejo de errores central en el back
- Seguridad en el back, cors, helmet, rate limit y logs
- Readme y scripts del backend, documentando los endpoints

### Front — 6 commits (app Next en `src/`)
Todo pasa ESLint. Incluye dos bugs reales:

- Arreglando el formulario de productos, el visible en catalogo no se
  desactivaba → al desmarcar "Visible en catálogo" se guardaba igual como
  visible (`z.coerce.boolean` + checkbox sin hidden).
- Mejorando el catalogo publico, boton para limpiar la busqueda
- Agregando esqueleto de carga propio al editor de catalogo
- Accesibilidad y consistencia, boton de limpiar busqueda en productos
- Mejorando pedidos, ahora los pedidos largos se pueden volver a cerrar → una
  vez expandido no se podía colapsar.
- Ajustes en el login, enfoca el primer campo al abrir y cambiar de pestaña

### Varios — 4 commits
- Documentando la base de supabase, migraciones, rls y el place_order
- Actualizando el readme con la separacion de front, back y supabase
- Aclarando variables de entorno, lo de las imagenes y el env del back
- Scripts para correr el backend desde la raiz y limpieza

## Cómo quedó la separación

- **front** → Next en `src/` (intacto, el deploy de Cloudflare no se tocó).
- **back** → `backend/` Express: rutas de productos/catálogos/pedidos/storefront,
  auth por token con RLS, validación zod, errores centrales y seguridad.
- **supabase** → `supabase/` con su README.

---

## Qué cambió después de esta entrega (revisado el 2026-11-12, posterior)

Los tres «pendientes» que cerraban este documento quedaron obsoletos. Esto es
lo comprobado hoy en el repo:

1. **El backend sí está instalado y type-chequeado.** `backend/node_modules`
   existe y `pnpm backend:typecheck` (`tsc --noEmit` dentro de `backend/`)
   termina sin errores. Decía lo contrario porque en su momento faltaban las
   dependencias.

2. **El front ya consume el backend**, de forma condicional. `src/lib/backend.ts`
   es el cliente HTTP (solo servidor): manda el access token de Supabase como
   `Authorization: Bearer` y el backend lo revalida contra Auth. Con
   `BACKEND_URL` vacía todo sigue yendo directo a Supabase; con `BACKEND_URL`
   definida pasan por la API el envío de pedidos (`src/lib/actions/order-actions.ts`),
   el listado y cambio de estado de pedidos (`src/app/dashboard/pedidos/`) y el
   crear/editar/borrar de productos y catálogos
   (`src/app/dashboard/productos/actions.ts`, `src/app/dashboard/catalogos/actions.ts`).
   El detalle de qué sigue yendo directo a Supabase está en el README, sección
   «El front consume el back (`BACKEND_URL`)».

3. **El trabajo está commiteado y hay remoto.** El repo tiene historial en `main`
   y `origin` apunta a `github.com:derekkv/catalii.git`; en el momento de
   escribir esto quedaban 6 commits locales sin empujar (`git status -sb`). Ya
   no es cierto que «nada se subió a remoto». Lo que falte de control de
   versiones se sigue en `PENDIENTES.md` #1.

Lo único de la lista original que sigue vigente es la decisión de fondo: la capa
de servidor de Next no se migró entera a Express y mantener las dos rutas tiene
coste. Esa decisión, los endpoints que faltan, la lógica duplicada y el
despliegue del backend están como tareas **#25–#28** en `PENDIENTES.md`.
