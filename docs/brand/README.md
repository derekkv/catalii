# Logo de Catalii

Propuesta creada en VectorCraft para la identidad de Catalii.

## Concepto

El símbolo combina:

- una **C** geométrica por Catalii;
- dos reglas interiores que representan una lista de precios o catálogo;
- un punto cuadrado color óxido que representa el pedido ya seleccionado y conserva la idea del «punto de tinta» del wordmark actual.

La geometría recta, sin degradados ni sombras, sigue la dirección visual de «papel de imprenta comercial» del producto y funciona a una tinta.

## Colores

- Azul industrial: `#1B3A5C`
- Óxido: `#B2561B`
- Tinta: `#161D24`
- Papel frío: `#F5F7F8`
- Reverso: `#F4F8FB`

## Tipografía

La composición fuente usa **Noto Serif Display Medium** para el wordmark porque VectorCraft no tenía Fraunces disponible. Los SVG entregados convierten el texto a contornos, por lo que no dependen de fuentes instaladas. Para uso en la aplicación, el componente existente puede conservar Fraunces.

## Archivos

Los archivos servibles en web viven en `public/brand/` (son públicos: cualquiera
puede descargarlos). Las **fuentes editables y las láminas de propuesta** se
movieron a `docs/brand/` para no publicarlas.

### Propuesta V1 (histórica, no se usa en la aplicación)

- `docs/brand/catalii-logo.vectorcraft`: fuente editable con cinco mesas de trabajo.
- `docs/brand/catalii-logo-presentacion.png`: lámina general de la propuesta.
- `public/brand/catalii-logo-principal.svg` y `.png`: logo horizontal a color.
- `public/brand/catalii-simbolo.svg` y `.png`: símbolo cuadrado sobre fondo transparente.
- `public/brand/catalii-logo-monocromo.svg`: versión de una tinta.
- `public/brand/catalii-logo-reverso.svg` y `.png`: versión para fondos oscuros.

## Rediseño V2 — catálogo abierto (versión en uso)

Esta es la propuesta recomendada tras revisar la primera dirección, y es la que
usa la aplicación. Sustituye el monograma geométrico por un catálogo abierto con:

- cubierta azul y lomo terracota;
- fotografía de producto ilustrada;
- filas de catálogo y un producto destacado;
- marcador dorado y destello de cierre;
- páginas curvas para dar movimiento y cercanía.

Paleta V2: cubierta `#17324d`, lomo/sombra `#d9653b`, marcador `#f2b84b`,
páginas `#fffdf8`.

Archivos del rediseño:

- `docs/brand/catalii-logo-v2.vectorcraft` (fuente editable, fuera de `public/`)
- `docs/brand/catalii-logo-v2-presentacion.png` (lámina de propuesta, **no es para la web**)
- `public/brand/catalii-logo-v2-principal.svg` y `.png` (2000×640 el PNG)
- `public/brand/catalii-simbolo-v2.svg` y `.png`
- `public/brand/catalii-logo-v2-monocromo.svg`
- `public/brand/catalii-logo-v2-reverso.svg` y `.png`

Los SVG tienen el texto convertido a contornos y no dependen de fuentes instaladas.

## Uso en la aplicación

El logo horizontal lleva el texto en contornos con color fijo, así que **no se
adapta** a los cinco themes (en `noche` el texto quedaría ilegible). Por eso la
interfaz no lo usa: compone la marca con el símbolo más el logotipo tipográfico.

| Dónde | Archivo / componente |
|---|---|
| Cabeceras y pies de la app (landing, panel, acceso) | `src/components/brand/brand-logo.tsx` → símbolo V2 + `<Wordmark>` |
| Favicon moderno | `src/app/icon.svg` (copia de `catalii-simbolo-v2.svg`) |
| Icono de iOS | `src/app/apple-icon.png` (copia de `catalii-simbolo-v2.png`) |
| Open Graph / Twitter | `public/brand/catalii-logo-v2-principal.png` (2000×640) |
| Lámina sobre fondo propio (cierre de la landing) | `public/brand/catalii-logo-v2-reverso.svg` |

Regla de uso: sobre fondo oscuro, `catalii-logo-v2-reverso.svg` (trae su propio
fondo azul, así que es seguro en cualquier theme); sobre fondo claro, el
principal o la composición símbolo + logotipo. Los archivos V1 (sin `-v2`) se
conservan pero no se usan.
