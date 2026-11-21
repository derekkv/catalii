/**
 * Aplicación del mapeo a las filas del archivo.
 *
 * Es el único sitio donde se transforman los datos, y lo hace código, no la
 * IA: la propuesta de Gemini sólo dice "la columna 3 es el precio". Aquí se
 * recorta, se convierten las cifras (`numbers.ts`) y se valida con
 * `productSchema`, igual que antes.
 *
 * Módulo isomorfo: lo usa la acción del servidor para insertar y el
 * componente de revisión para pintar la vista previa. Que sea el mismo código
 * es el punto: lo que el usuario ve en la vista previa es exactamente lo que
 * se va a guardar.
 */

import { productSchema, type ProductInput } from "@/lib/validation";
import { toCurrencyCode, toNumericText } from "./numbers";
import {
  type Cell,
  type MappingPlan,
  type ProductField,
  cellText,
} from "./types";

/**
 * Etiqueta de cada columna para la interfaz.
 *
 * Con encabezados se usa el texto del archivo; sin ellos (o si la celda está
 * vacía), "Columna N". Depende de `plan.hasHeaderRow`, así que al desmarcar
 * esa casilla las etiquetas cambian solas.
 */
export function columnLabels(rows: Cell[][], plan: MappingPlan): string[] {
  const first = rows[0] ?? [];
  return plan.columns.map((c) => {
    const header = plan.hasHeaderRow ? cellText(first[c.index], 60) : "";
    return header !== "" ? header : `Columna ${c.index + 1}`;
  });
}

/** Resultado de una fila del archivo: producto listo o motivo del descarte. */
export interface RowResult {
  /** Número de fila **en el archivo**, 1-based, contando los encabezados. */
  line: number;
  /** Lo que se leyó de la fila, por campo. Se muestra en la vista previa. */
  raw: Partial<Record<ProductField, string>>;
  product?: ProductInput;
  error?: string;
}

/** Longitud máxima de un texto largo; el esquema la vuelve a comprobar. */
const MAX_TEXT = 2000;

/** Columna (la primera) asignada a cada campo del plan. */
function columnsByField(plan: MappingPlan): Map<ProductField, number> {
  const map = new Map<ProductField, number>();
  for (const c of plan.columns) {
    if (c.field === "ignore") continue;
    if (!map.has(c.field)) map.set(c.field, c.index);
  }
  return map;
}

/**
 * Datos crudos de una fila, ya por campo de producto.
 *
 * Separado de la validación porque la vista previa necesita enseñar qué se
 * leyó incluso cuando la fila no pasa el esquema.
 */
function readRow(
  row: Cell[],
  byField: Map<ProductField, number>,
  decimal: MappingPlan["decimal"],
): Partial<Record<ProductField, string>> {
  const at = (field: ProductField): Cell | undefined => {
    const index = byField.get(field);
    return index === undefined ? undefined : row[index];
  };

  return {
    name: cellText(at("name"), 200),
    sku: cellText(at("sku"), 60),
    description: cellText(at("description"), MAX_TEXT),
    category: cellText(at("category"), 80),
    price: toNumericText(at("price"), decimal),
    currency: toCurrencyCode(at("currency")),
    stock: toNumericText(at("stock"), decimal),
    min_order_qty: toNumericText(at("min_order_qty"), decimal),
    image_url: cellText(at("image_url"), 600),
  };
}

/**
 * Convierte y valida las filas de datos.
 *
 * @param rows  Filas del archivo, **incluida** la de encabezados si la hay.
 * @param plan  Mapeo confirmado por el usuario.
 * @param limit Tope de filas de datos a procesar (límite del plan).
 *
 * Los números de fila son los del archivo, para que los mensajes sigan
 * diciendo "fila 3: Nombre requerido" y el usuario pueda abrirlo y corregirlo.
 */
export function parseRows(rows: Cell[][], plan: MappingPlan, limit = Infinity): RowResult[] {
  const byField = columnsByField(plan);
  const start = plan.hasHeaderRow ? 1 : 0;
  const results: RowResult[] = [];

  for (let i = start; i < rows.length && results.length < limit; i++) {
    const row = rows[i] ?? [];
    // Fila completamente vacía: no es un error del usuario, es relleno de la
    // hoja de cálculo. Se salta sin contarla como omitida.
    if (row.every((c) => cellText(c) === "")) continue;

    const raw = readRow(row, byField, plan.decimal);
    const parsed = productSchema.safeParse({
      name: raw.name ?? "",
      sku: raw.sku ?? "",
      description: raw.description ?? "",
      category: raw.category ?? "",
      price: raw.price || "0",
      currency: raw.currency || "USD",
      stock: raw.stock || "0",
      min_order_qty: raw.min_order_qty || "1",
      image_url: raw.image_url ?? "",
      active: "true",
    });

    results.push(
      parsed.success
        ? { line: i + 1, raw, product: parsed.data }
        : { line: i + 1, raw, error: parsed.error.issues[0]?.message ?? "datos inválidos" },
    );
  }

  return results;
}

/**
 * "fila 3: Nombre requerido; fila 8: …" y, si hay más, cuántas quedan.
 *
 * Se guardan sólo los primeros motivos: con un archivo entero mal, el mensaje
 * sería ilegible.
 */
export function problemsText(results: RowResult[], max = 3): string {
  const failed = results.filter((r) => r.error);
  const shown = failed.slice(0, max).map((r) => `fila ${r.line}: ${r.error}`);
  const rest = failed.length - shown.length;
  return shown.join("; ") + (rest > 0 ? `; y ${rest} más` : "");
}
