# Evidencias de accesibilidad (órdenes 6, 8 y 9) — Catalii

> **No es asesoría legal ni afirma que la app «cumpla» WCAG ni ninguna ley.** Documenta qué se midió y qué se cambió. **No se ejecutaron Lighthouse ni axe** (no están disponibles en este entorno ni se instalaron) y **no se hizo prueba con lector de pantalla ni con teclado real en navegador**: solo cálculo y lectura de código.

## 1. Método de contraste (orden 6)

- Fórmula de contraste WCAG 2.x (luminancia relativa sRGB; razón = (L1+0,05)/(L2+0,05)), con un script temporal de Node sin librerías (ya borrado), que lee los tokens `--*` de cada `[data-theme]` en `src/app/globals.css`.
- Umbrales: **4,5:1** texto normal · **3:1** componentes de UI (bordes de control, anillo de foco) y texto grande.
- Themes calculados: `press`, `noche`, `mercado`, `acero`, `hueso` (los tres que faltaban + revalidación de `press` y `acero`).
- Los colores con transparencia (placeholder al 70 %) se compusieron sobre el fondo real antes de medir.
- **No medido:** texto sobre fotos subidas por usuarios, estados `disabled` (exentos de WCAG), degradados/granulado `.grain`, hover de enlaces y badges individuales, ni páginas renderizadas (solo tokens).

## 2. Cambios aplicados

| # | Problema (antes) | Cambio | Archivo |
|---|---|---|---|
| 1 | Placeholder: `muted-foreground` al 70 % → 3,16:1 (press), 3,17 (acero), 3,18 (mercado), 3,29 (hueso), 4,17 (noche) sobre `card` | Se quita la opacidad: `placeholder:text-muted-foreground` → 6,13 / 6,17 / 6,23 / 6,58 / 7,09 | `src/components/ui/input.tsx:18` |
| 2 | `--input` de **noche** `#574838`: borde de control 1,96:1 sobre `card` y 2,12:1 sobre `background` | `#7a6752` → 3,19:1 / 3,44:1 | `src/app/globals.css` (bloque `noche`) |
| 3 | `--input` de **mercado** `#8c9381`: 2,96:1 sobre `background` | `#878e7c` → 3,39:1 (card) / 3,16:1 (background) | `src/app/globals.css` (bloque `mercado`) |
| 4 | Hover del botón primario en **noche**: oscurecer 12 % con negro bajaba `on-primary/primary` a 4,04:1 | Nuevo token `--hover-shade` (`black` por defecto, `white` en noche): el hover aclara → 5,81:1. Accent y destructive usan el mismo token | `globals.css`, `ui/button.tsx` |
| 5 | **Orden 9.** `Button` tenía `focus-visible:outline-none` sin sustituto; las utilidades de Tailwind ganan a la regla global (`@layer base`) y el botón no mostraba foco | Anillo explícito: `focus-visible:outline-3 outline-offset-2 outline-ring` (3 px, separación 2 px, color `--ring`) | `src/components/ui/button.tsx:23-25` |

Contraste del anillo de foco (`--ring`) contra el fondo adyacente (`background`/`card`): **≥ 4,68:1 en los 5 themes** (ver filas «ring(foco)»).

Recalculado tras los cambios: **ningún par de los medidos queda por debajo de su umbral**. En las tablas, las filas «placeholder ANTES» conservan el valor previo como evidencia («ya no se usa»). La columna «Antes» de la fila «placeholder AHORA» repite el valor actual porque el cálculo se hizo sobre los tokens; el valor anterior real es el de la fila «ANTES».

## 3. Razones de contraste por theme (antes → después)

«Antes» = tokens previos de `globals.css`; «Después» = tokens actuales. Los pares sin cambio repiten la razón.

#### press

| Par | Mínimo | Antes | Después | Resultado |
|---|---|---|---|---|
| foreground/background | 4.5:1 | 16.85 | 16.85 | OK |
| card-fg/card | 4.5:1 | 17.85 | 17.85 | OK |
| muted-fg/background | 4.5:1 | 5.79 | 5.79 | OK |
| muted-fg/card | 4.5:1 | 6.13 | 6.13 | OK |
| muted-fg/muted | 4.5:1 | 5.17 | 5.17 | OK |
| on-primary/primary | 4.5:1 | 5.67 | 5.67 | OK |
| on-secondary/secondary | 4.5:1 | 16.16 | 16.16 | OK |
| on-accent/accent | 4.5:1 | 16.16 | 16.16 | OK |
| on-destructive/destructive | 4.5:1 | 6.94 | 6.94 | OK |
| on-success/success | 4.5:1 | 6.48 | 6.48 | OK |
| on-warning/warning | 4.5:1 | 5.91 | 5.91 | OK |
| primary/background (enlace) | 4.5:1 | 5.53 | 5.53 | OK |
| destructive/background (error) | 4.5:1 | 6.77 | 6.77 | OK |
| success/background | 4.5:1 | 6.11 | 6.11 | OK |
| warning/background | 4.5:1 | 5.58 | 5.58 | OK |
| accent/background | 3:1 | 16.16 | 16.16 | OK |
| input(borde)/card | 3:1 | 3.35 | 3.35 | OK |
| input(borde)/background | 3:1 | 3.16 | 3.16 | OK |
| ring(foco)/background | 3:1 | 5.53 | 5.53 | OK |
| ring(foco)/card | 3:1 | 5.86 | 5.86 | OK |
| ring(foco)/muted | 3:1 | 4.94 | 4.94 | OK |
| placeholder ANTES (muted-fg al 70 %) / card | 4.5:1 | 3.16 | 3.16 | ya no se usa |
| placeholder AHORA (muted-fg al 100 %) / card | 4.5:1 | 6.13 | 6.13 | OK |

#### noche

| Par | Mínimo | Antes | Después | Resultado |
|---|---|---|---|---|
| foreground/background | 4.5:1 | 16.01 | 16.01 | OK |
| card-fg/card | 4.5:1 | 14.83 | 14.83 | OK |
| muted-fg/background | 4.5:1 | 7.65 | 7.65 | OK |
| muted-fg/card | 4.5:1 | 7.09 | 7.09 | OK |
| muted-fg/muted | 4.5:1 | 6.44 | 6.44 | OK |
| on-primary/primary | 4.5:1 | 5.03 | 5.03 | OK |
| on-secondary/secondary | 4.5:1 | 16.01 | 16.01 | OK |
| on-accent/accent | 4.5:1 | 10.09 | 10.09 | OK |
| on-destructive/destructive | 4.5:1 | 6.78 | 6.78 | OK |
| on-success/success | 4.5:1 | 8.55 | 8.55 | OK |
| on-warning/warning | 4.5:1 | 10.93 | 10.93 | OK |
| primary/background (enlace) | 4.5:1 | 5.05 | 5.05 | OK |
| destructive/background (error) | 4.5:1 | 6.81 | 6.81 | OK |
| success/background | 4.5:1 | 10.67 | 10.67 | OK |
| warning/background | 4.5:1 | 11.14 | 11.14 | OK |
| accent/background | 3:1 | 10.09 | 10.09 | OK |
| input(borde)/card | 3:1 | 1.96 | 3.19 | OK |
| input(borde)/background | 3:1 | 2.12 | 3.44 | OK |
| ring(foco)/background | 3:1 | 5.05 | 5.05 | OK |
| ring(foco)/card | 3:1 | 4.68 | 4.68 | OK |
| ring(foco)/muted | 3:1 | 4.25 | 4.25 | OK |
| placeholder ANTES (muted-fg al 70 %) / card | 4.5:1 | 4.17 | 4.17 | ya no se usa |
| placeholder AHORA (muted-fg al 100 %) / card | 4.5:1 | 7.09 | 7.09 | OK |

#### mercado

| Par | Mínimo | Antes | Después | Resultado |
|---|---|---|---|---|
| foreground/background | 4.5:1 | 15.44 | 15.44 | OK |
| card-fg/card | 4.5:1 | 16.57 | 16.57 | OK |
| muted-fg/background | 4.5:1 | 5.80 | 5.80 | OK |
| muted-fg/card | 4.5:1 | 6.23 | 6.23 | OK |
| muted-fg/muted | 4.5:1 | 5.31 | 5.31 | OK |
| on-primary/primary | 4.5:1 | 7.54 | 7.54 | OK |
| on-secondary/secondary | 4.5:1 | 15.12 | 15.12 | OK |
| on-accent/accent | 4.5:1 | 4.89 | 4.89 | OK |
| on-destructive/destructive | 4.5:1 | 6.94 | 6.94 | OK |
| on-success/success | 4.5:1 | 6.48 | 6.48 | OK |
| on-warning/warning | 4.5:1 | 5.91 | 5.91 | OK |
| primary/background (enlace) | 4.5:1 | 7.39 | 7.39 | OK |
| destructive/background (error) | 4.5:1 | 6.68 | 6.68 | OK |
| success/background | 4.5:1 | 6.03 | 6.03 | OK |
| warning/background | 4.5:1 | 5.51 | 5.51 | OK |
| accent/background | 3:1 | 4.73 | 4.73 | OK |
| input(borde)/card | 3:1 | 3.18 | 3.39 | OK |
| input(borde)/background | 3:1 | 2.96 | 3.16 | OK |
| ring(foco)/background | 3:1 | 7.39 | 7.39 | OK |
| ring(foco)/card | 3:1 | 7.94 | 7.94 | OK |
| ring(foco)/muted | 3:1 | 6.77 | 6.77 | OK |
| placeholder ANTES (muted-fg al 70 %) / card | 4.5:1 | 3.18 | 3.18 | ya no se usa |
| placeholder AHORA (muted-fg al 100 %) / card | 4.5:1 | 6.23 | 6.23 | OK |

#### acero

| Par | Mínimo | Antes | Después | Resultado |
|---|---|---|---|---|
| foreground/background | 4.5:1 | 15.82 | 15.82 | OK |
| card-fg/card | 4.5:1 | 17.00 | 17.00 | OK |
| muted-fg/background | 4.5:1 | 5.74 | 5.74 | OK |
| muted-fg/card | 4.5:1 | 6.17 | 6.17 | OK |
| muted-fg/muted | 4.5:1 | 5.23 | 5.23 | OK |
| on-primary/primary | 4.5:1 | 10.89 | 10.89 | OK |
| on-secondary/secondary | 4.5:1 | 15.42 | 15.42 | OK |
| on-accent/accent | 4.5:1 | 4.77 | 4.77 | OK |
| on-destructive/destructive | 4.5:1 | 6.94 | 6.94 | OK |
| on-success/success | 4.5:1 | 6.48 | 6.48 | OK |
| on-warning/warning | 4.5:1 | 5.91 | 5.91 | OK |
| primary/background (enlace) | 4.5:1 | 10.82 | 10.82 | OK |
| destructive/background (error) | 4.5:1 | 6.68 | 6.68 | OK |
| success/background | 4.5:1 | 6.03 | 6.03 | OK |
| warning/background | 4.5:1 | 5.50 | 5.50 | OK |
| accent/background | 3:1 | 4.61 | 4.61 | OK |
| input(borde)/card | 3:1 | 3.27 | 3.27 | OK |
| input(borde)/background | 3:1 | 3.04 | 3.04 | OK |
| ring(foco)/background | 3:1 | 10.82 | 10.82 | OK |
| ring(foco)/card | 3:1 | 11.63 | 11.63 | OK |
| ring(foco)/muted | 3:1 | 9.86 | 9.86 | OK |
| placeholder ANTES (muted-fg al 70 %) / card | 4.5:1 | 3.17 | 3.17 | ya no se usa |
| placeholder AHORA (muted-fg al 100 %) / card | 4.5:1 | 6.17 | 6.17 | OK |

#### hueso

| Par | Mínimo | Antes | Después | Resultado |
|---|---|---|---|---|
| foreground/background | 4.5:1 | 17.86 | 17.86 | OK |
| card-fg/card | 4.5:1 | 18.93 | 18.93 | OK |
| muted-fg/background | 4.5:1 | 6.21 | 6.21 | OK |
| muted-fg/card | 4.5:1 | 6.58 | 6.58 | OK |
| muted-fg/muted | 4.5:1 | 5.59 | 5.59 | OK |
| on-primary/primary | 4.5:1 | 17.33 | 17.33 | OK |
| on-secondary/secondary | 4.5:1 | 11.56 | 11.56 | OK |
| on-accent/accent | 4.5:1 | 4.96 | 4.96 | OK |
| on-destructive/destructive | 4.5:1 | 6.94 | 6.94 | OK |
| on-success/success | 4.5:1 | 6.48 | 6.48 | OK |
| on-warning/warning | 4.5:1 | 5.91 | 5.91 | OK |
| primary/background (enlace) | 4.5:1 | 17.47 | 17.47 | OK |
| destructive/background (error) | 4.5:1 | 6.77 | 6.77 | OK |
| success/background | 4.5:1 | 6.11 | 6.11 | OK |
| warning/background | 4.5:1 | 5.58 | 5.58 | OK |
| accent/background | 3:1 | 4.76 | 4.76 | OK |
| input(borde)/card | 3:1 | 3.23 | 3.23 | OK |
| input(borde)/background | 3:1 | 3.05 | 3.05 | OK |
| ring(foco)/background | 3:1 | 4.76 | 4.76 | OK |
| ring(foco)/card | 3:1 | 5.05 | 5.05 | OK |
| ring(foco)/muted | 3:1 | 4.29 | 4.29 | OK |
| placeholder ANTES (muted-fg al 70 %) / card | 4.5:1 | 3.29 | 3.29 | ya no se usa |
| placeholder AHORA (muted-fg al 100 %) / card | 4.5:1 | 6.58 | 6.58 | OK |

## 4. Foco visible por teclado (orden 9) — revisión estática

Búsqueda de `outline-none` en `src/`:

| Archivo:línea | Elemento | Estado |
|---|---|---|
| `src/components/ui/button.tsx:23` | Todos los `Button` | **Corregido** (sección 2, #5) |
| `src/components/ui/input.tsx:20` | Input/Textarea/Select | Hay sustituto: borde `--ring` (≥ 4,68:1) + halo de 3 px al 28 %. Aceptable; el halo por sí solo no pasa 3:1 |
| `src/components/ui/overlay.tsx:137,210` | Contenedor de diálogo/drawer (`tabIndex=-1`) | Receptor de foco programático, no es un control. Sin acción |
| `ui/toast.tsx`, `ui/confirm.tsx`, `ui/badge.tsx`, `ui/card.tsx`, `theme/*` | Botones/enlaces | Sin `outline-none`: usan la regla global de 3 px (`globals.css`, `@layer base`). `confirm` usa `Button` (ya corregido) |
| `src/app/c/[slug]/storefront.tsx:238` | `<select>` de orden | **Fuera de mi lista, sin tocar.** `focus-visible:outline-none` + solo halo al 28 % de `--ring`, sin cambio de borde: foco débil. Sugerido: añadir `focus-visible:border-ring` o quitar `focus-visible:outline-none` |
| `src/app/dashboard/pedidos/order-status-select.tsx:66` | `<select>` de estado | **Fuera de mi lista, sin tocar.** Mismo problema |
| `src/app/c/[slug]/storefront.tsx:947` | Mensaje de error `role="alert"` `tabIndex=-1` | Receptor de foco programático. Sin acción |

No verificado en navegador: orden de tabulación real, trampa de foco, ni que Tailwind genere `outline-3` con la versión instalada.

## 5. Texto alternativo (orden 8)

- `src/components/media/brand-image-upload.tsx:108`: es la **vista previa del logo o banner que el usuario acaba de subir**; el único texto cercano es una etiqueta genérica (`label`). Como la imagen es justo lo que se está eligiendo, se cambió `alt=""` por `alt={`Vista previa: ${label}`}`.
- Los demás `alt=""` de DIAGNOSTICO (`c/[slug]/page.tsx` logo/banner junto al nombre, miniaturas de `storefront.tsx`, avatar de `dashboard/layout.tsx`, `products-client.tsx`) están en archivos fuera de mi lista: **no se tocaron ni se re-revisaron**.

## 6. Pendiente (no hecho)

- Ejecutar Lighthouse y axe en landing, login, catálogo público, dashboard y facturación, en los 5 themes.
- Prueba manual de teclado y con lector de pantalla.
- Tamaño de objetivo táctil, zoom al 200 %/400 %.
