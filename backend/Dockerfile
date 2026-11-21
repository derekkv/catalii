# Imagen del backend de Catalii (Express + MongoDB).
#
# Multi-stage para que la imagen final no lleve TypeScript, tsx ni el código
# fuente: solo `dist/` y las dependencias de producción.
#
#   docker build -t catalii-backend ./backend
#   docker run --rm -p 8787:8787 --env-file backend/.env catalii-backend
#
# El puerto se toma de PORT (8787 por defecto), que es lo que esperan Fly.io,
# Railway, Render y compañía.

# ---------------------------------------------------------------------------
# 1. Dependencias + compilación
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# `corepack` fija la versión de pnpm sin instalarla a mano.
RUN corepack enable

# Primero los manifiestos: si no cambian, Docker reutiliza la capa de deps.
COPY package.json pnpm-lock.yaml ./

# `--ignore-workspace`: el pnpm-workspace.yaml de la raíz del repo no entra en
# la imagen, y sin esta bandera pnpm intentaría resolver el workspace entero.
RUN pnpm install --frozen-lockfile --ignore-workspace

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# Compila a dist/ y reescribe el alias @/* a rutas relativas.
RUN pnpm run build

# Se rehacen las dependencias dejando solo las de producción: tsx, TypeScript y
# tsc-alias no tienen por qué viajar a la imagen final.
RUN pnpm prune --prod --ignore-workspace

# ---------------------------------------------------------------------------
# 2. Imagen final
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
# Node solo ve el heap que le deja el contenedor; esto evita que se pase en
# hosts de 512 MB.
ENV NODE_OPTIONS=--max-old-space-size=384

WORKDIR /app

# `node` es un usuario sin privilegios que ya trae la imagen oficial. El código
# es de root y solo legible por el proceso: no puede reescribirse a sí mismo.
COPY --from=builder --chown=root:root /app/node_modules ./node_modules
COPY --from=builder --chown=root:root /app/dist ./dist
COPY --from=builder --chown=root:root /app/package.json ./package.json

USER node

EXPOSE 8787

# Sonda del propio contenedor. Mira que el proceso responda; NO exige Mongo a
# propósito: sin analítica el servicio sigue siendo útil (ver README).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Sin npm/pnpm por medio: `node` recibe las señales (SIGTERM) y el apagado
# ordenado de server.ts cierra el pool de Mongo.
CMD ["node", "dist/server.js"]
