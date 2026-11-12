# Créditos de recursos de terceros (CREDITS)

> **No es asesoría legal.** Lista fuentes tipográficas, íconos y otros recursos que no son código propio. Las dependencias de código (con sus licencias y avisos) están en [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Fuentes tipográficas (cargadas con `next/font/google`, `src/app/layout.tsx`)

La licencia se verificó en el archivo `METADATA.pb` de cada familia en el repositorio oficial `google/fonts` (campo `license: "OFL"` → SIL Open Font License 1.1). `next/font/google` descarga los archivos en el build y los sirve desde el propio dominio; **esto último no se comprobó en un build real** (ver `docs/legal/AUDITORIA_SDKS.md`).

| Fuente | Autoría (según METADATA) | Licencia | Fuente de verificación |
|---|---|---|---|
| Fraunces | «Copyright 2020 The Fraunces Project Authors» (Undercase Type, Phaedra Charles, Flavia Zimbardi) · https://github.com/undercasetype/Fraunces | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/fraunces/METADATA.pb |
| Archivo | «Copyright 2020 The Archivo Project Authors» (Omnibus-Type) · https://github.com/Omnibus-Type/Archivo | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/archivo/METADATA.pb |
| JetBrains Mono | «Copyright 2020 The JetBrains Mono Project Authors» (JetBrains, Philipp Nurullin, Konstantin Bulenkov) · https://github.com/JetBrains/JetBrainsMono | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/jetbrainsmono/METADATA.pb |

Texto de la licencia: https://openfontlicense.org/ (OFL-1.1). La OFL permite uso comercial e incrustación; exige conservar el aviso de copyright y la licencia si se redistribuyen los archivos de fuente, y no permite vender las fuentes por sí solas. Si se llegaran a guardar los `.woff2` en el repositorio o a distribuirse aparte, hay que incluir el texto OFL de cada familia. El texto íntegro de cada licencia no se descargó a este repositorio (**pendiente**).

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

- Las maquetas de la landing usan nombres de productos con marca real como texto (p. ej. «Coca-Cola 600 ml»): ver pregunta al abogado en `docs/legal/DIAGNOSTICO.md` (orden 10).

## Pendiente

- [x] `src/app/favicon.ico` regenerado desde `catalii-simbolo-v2.png`: ya no hay iconos de origen desconocido.
- [ ] Confirmar autoría y titularidad de los logos de `public/brand/` y `docs/brand/` **[PREGUNTAR AL DUEÑO]**.
- [ ] Decidir si se añade el texto OFL completo de las tres fuentes.
- [ ] Revisar este archivo y `THIRD_PARTY_NOTICES.md` con el abogado.
