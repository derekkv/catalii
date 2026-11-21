# Créditos de recursos de terceros (CREDITS)

> **No es asesoría legal.** Lista fuentes tipográficas, íconos y otros recursos que no son código propio. Las dependencias de código (con sus licencias y avisos) están en [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Fuentes tipográficas (autoalojadas con `next/font/local`, archivos en `src/fonts/`)

Los `.woff2` **están versionados en este repositorio** (`src/fonts/`) y se cargan con `next/font/local` desde `src/app/layout.tsx`. Antes se pedían con `next/font/google` en cada build; se cambiaron porque Turbopack (Next 16.3.x) rompe el build cuando la API de Google devuelve URLs de subconjunto dinámico ([vercel/next.js#97344](https://github.com/vercel/next.js/issues/97344)). Detalle técnico y procedencia exacta de cada archivo en [`src/fonts/README.md`](./src/fonts/README.md).

Consecuencia legal del cambio: ahora **sí redistribuimos los archivos de fuente**, así que la OFL obliga a acompañarlos de su aviso de copyright y del texto de la licencia. Hecho: hay un `OFL-*.txt` íntegro por familia junto a las fuentes, descargado del repositorio oficial `google/fonts`.

Consecuencia técnica, también comprobada en un build real (`next build` + `next start`): el HTML referencia los tres woff2 bajo `/_next/static/media/` y no se pide nada a `fonts.googleapis.com` ni a `fonts.gstatic.com`, ni en build ni en runtime (cf. `docs/legal/AUDITORIA_SDKS.md`).

| Fuente | Aviso de copyright (del propio `OFL.txt`) | Licencia | Archivo en el repo | Texto de la licencia |
|---|---|---|---|---|
| Fraunces | «Copyright 2018 The Fraunces Project Authors» (Undercase Type, Phaedra Charles, Flavia Zimbardi) · https://github.com/undercasetype/Fraunces | SIL OFL 1.1 | `src/fonts/Fraunces-latin.woff2` (121 016 B) | [`src/fonts/OFL-Fraunces.txt`](./src/fonts/OFL-Fraunces.txt) ← https://github.com/google/fonts/blob/main/ofl/fraunces/OFL.txt |
| Archivo | «Copyright 2020 The Archivo Project Authors» (Omnibus-Type) · https://github.com/Omnibus-Type/Archivo | SIL OFL 1.1 | `src/fonts/Archivo-latin.woff2` (34 928 B) | [`src/fonts/OFL-Archivo.txt`](./src/fonts/OFL-Archivo.txt) ← https://github.com/google/fonts/blob/main/ofl/archivo/OFL.txt |
| JetBrains Mono | «Copyright 2020 The JetBrains Mono Project Authors» (JetBrains, Philipp Nurullin, Konstantin Bulenkov) · https://github.com/JetBrains/JetBrainsMono | SIL OFL 1.1 | `src/fonts/JetBrainsMono-latin.woff2` (40 404 B) | [`src/fonts/OFL-JetBrainsMono.txt`](./src/fonts/OFL-JetBrainsMono.txt) ← https://github.com/google/fonts/blob/main/ofl/jetbrainsmono/OFL.txt |

El aviso de Fraunces se corrigió a 2018: es el año que figura en el `OFL.txt` descargado, no 2020 como decía antes esta tabla. La clasificación OFL se había verificado además en el `METADATA.pb` de cada familia en `google/fonts` (campo `license: "OFL"`).

La OFL permite uso comercial e incrustación; exige conservar el aviso de copyright y la licencia al redistribuir los archivos de fuente, y no permite venderlas por sí solas. Los archivos guardados son subconjuntos (bloque `latin`) de los woff2 variables que servía Google: la OFL permite modificar y subconjuntar, con la condición de no usar los Reserved Font Names —ninguno de los tres `OFL.txt` declara ninguno— y de mantener la misma licencia, que es lo que hacen estos `OFL-*.txt`.

## Íconos

- **lucide-react 0.469.0** — licencia **ISC** (leída de `node_modules/lucide-react/LICENSE`).
  «Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.»
  El texto ISC completo está en [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md). Nota: Lucide incorpora partes derivadas de Feather (MIT); el LICENSE del paquete solo menciona esa atribución, no incluye el texto MIT de Feather.

## Imágenes y gráficos

- `public/`: se eliminaron `file.svg`, `globe.svg`, `next.svg`, `vercel.svg` y `window.svg` (restos del template `create-next-app`, sin referencias en `src/`, README ni configuración). Lo único que queda en `public/` son los archivos de marca de `public/brand/` (ver abajo).
- **Logos de Catalii (`public/brand/`, `src/app/icon.svg`, `src/app/apple-icon.png`)**: creados para este proyecto con **VectorCraft**, según consta en [`docs/brand/README.md`](./docs/brand/README.md). No son recursos de terceros: no proceden de un banco de imágenes ni de una plantilla. Hay dos propuestas; la aplicación usa la **V2** (archivos con `-v2`). `src/app/icon.svg` y `src/app/apple-icon.png` son copias de `catalii-simbolo-v2.svg` y `.png`. Las fuentes editables (`.vectorcraft`) y las láminas de propuesta están en `docs/brand/`, fuera de `public/`, para no servirlas en web.
  - Titularidad: se entiende que es del dueño del proyecto, pero esto **no se pudo verificar desde el repositorio**. **[PREGUNTAR AL DUEÑO]**: ¿los hizo él o un tercero (diseñador, agencia, herramienta con términos propios)? Si fue un tercero, hace falta constancia de cesión de derechos. Conviene también confirmar si la composición fuente usa recursos de VectorCraft sujetos a licencia.
  - La lámina fuente usa **Noto Serif Display Medium** para el wordmark (en los SVG entregados el texto está convertido a contornos, así que no se redistribuye la fuente). Noto Serif Display se publica bajo SIL OFL 1.1; **no se verificó la copia concreta usada en VectorCraft** **[PREGUNTAR AL DUEÑO]**.
- El fondo de «grano» de `globals.css` es un SVG de ruido (`feTurbulence`) escrito en línea en el propio CSS; no es un recurso externo.
- **`src/app/favicon.ico`**: regenerado desde `public/brand/catalii-simbolo-v2.png` con ImageMagick (`magick … -define icon:auto-resize=48,32,16`), igual que `src/app/icon.svg` y `src/app/apple-icon.png` (180×180). Los tres son de marca propia, así que ya no queda ningún icono de origen desconocido. El `.ico` anterior, cuya procedencia no se pudo verificar, fue sustituido.

## Marcas y ejemplos

- Las maquetas de la landing, el placeholder del formulario de producto y la plantilla CSV usan nombres de producto **genéricos** («Refresco de cola 600 ml», «Galletas surtidas»), no marcas reales. Se cambiaron a propósito para no usar marcas de terceros como ejemplo; si vuelves a poner una marca real, consúltalo antes (orden 10 de `docs/legal/DIAGNOSTICO.md`).

## Pendiente

- [x] `src/app/favicon.ico` regenerado desde `catalii-simbolo-v2.png`: ya no hay iconos de origen desconocido.
- [ ] Confirmar autoría y titularidad de los logos de `public/brand/` y `docs/brand/` **[PREGUNTAR AL DUEÑO]**.
- [x] Texto OFL completo de las tres fuentes añadido en `src/fonts/OFL-*.txt` (obligatorio desde que los `.woff2` se versionan en el repo).
- [ ] Revisar este archivo y `THIRD_PARTY_NOTICES.md` con el abogado.
