# Separación front / back / supabase — notas de entrega

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

## Pendientes / cosas que debes saber (verificación honesta)

1. **El backend aún no está instalado ni type-chequeado.** Es código nuevo y
   coherente, pero no se corrió `tsc` porque faltan sus dependencias. Para
   validarlo:

   ```bash
   cd backend && pnpm install && pnpm typecheck && pnpm dev
   ```

2. **No se cambió la capa de servidor de Next.** Migrarla a Express de golpe
   rompería el deploy de Cloudflare. El backend queda como servicio paralelo
   para que el front lo consuma cuando quieras, sin tumbar lo que ya funciona.
   Si prefieres empezar a conectar el front a esta API (o mover físicamente
   `src/` dentro de `frontend/`), hay que planificarlo aparte.

3. **Nada se subió a remoto.** Sigues en `main` local; falta `git push` cuando
   lo decidas.
