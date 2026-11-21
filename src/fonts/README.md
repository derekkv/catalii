# Fuentes autoalojadas

Los `.woff2` de esta carpeta se cargan con `next/font/local` desde
`src/app/layout.tsx` (rutas relativas: `../fonts/…`). Next los copia al build
con hash y los sirve desde `/_next/static/media/`, así que en producción no se
hace ninguna petición a `fonts.googleapis.com` ni a `fonts.gstatic.com`.

## Por qué están versionadas

Antes se cargaban con `next/font/google`. En Next 16.3.x, Turbopack rompe el
build cuando la API de Google Fonts responde con URLs de subconjunto dinámico
(las de la forma `fonts.gstatic.com/l/font?…`, con `&` en la query):

```
Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
next/font/google queries have exactly one entry
```

El fallo es intermitente —depende de lo que devuelva Google en el momento del
build—, por eso compilaba en local y fallaba en Cloudflare. Referencias:
[vercel/next.js#97344](https://github.com/vercel/next.js/issues/97344) y
[PR #99132](https://github.com/vercel/next.js/pull/99132).

## Procedencia exacta

Cada archivo es el bloque `latin` del woff2 **variable** que sirve la propia API
de Google (CSS pedido con un User-Agent de Chrome para obtener woff2). El
subconjunto `latin` cubre `U+0000–00FF` más puntuación general y `U+20AC`, es
decir todo lo que necesita el español (vocales acentuadas, ñ, ü, ¿, ¡, €, comillas
tipográficas, rayas). No hace falta `latin-ext`.

| Archivo | Bytes | Ejes (`fvar`) | URL de origen |
|---|---|---|---|
| `Fraunces-latin.woff2` | 121 016 | `opsz` 9–144, `wght` 100–900, `SOFT` 0–100, `WONK` 0–1 | `https://fonts.gstatic.com/s/fraunces/v38/6NUV8FyLNQOQZAnv9ZwIlOk.woff2` |
| `Archivo-latin.woff2` | 34 928 | `wght` 100–900 | `https://fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sLydOxI.woff2` |
| `JetBrainsMono-latin.woff2` | 40 404 | `wght` 100–800 | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwE.woff2` |

Los CSS de los que salen esas URLs:

```
https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&display=swap
https://fonts.googleapis.com/css2?family=Archivo:wght@100..900&display=swap
https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap
```

Para Fraunces hay que pedir los cuatro ejes: si solo se pide `wght`, Google
devuelve un archivo recortado (y además con URL dinámica, la que rompe el
build). El archivo guardado sí trae `SOFT` y `WONK`, que `globals.css` usa en
`font-variation-settings: "SOFT" 0, "WONK" 1`.

## Para actualizarlas

1. Pide el CSS con User-Agent de Chrome: `curl -A "Mozilla/5.0 … Chrome/131.0.0.0 …" "<url del css>"`.
2. Quédate con la URL del bloque comentado `/* latin */`.
3. Descárgala y comprueba que es un woff2 de verdad (`file archivo.woff2`) y que
   mantiene los ejes esperados (`python3 -c "from fontTools.ttLib import TTFont; …"`).
4. Si cambia la versión de la familia (`v38`, `v25`, `v24`), actualiza la tabla de
   arriba y revisa si el aviso de copyright del `OFL-*.txt` sigue siendo el mismo.

## Licencias

Las tres familias son SIL Open Font License 1.1. El texto íntegro, con su aviso
de copyright, está junto a cada fuente: `OFL-Fraunces.txt`, `OFL-Archivo.txt`,
`OFL-JetBrainsMono.txt` (descargados de `google/fonts`). Ver `CREDITS.md`.
