/**
 * Tipos y esquemas compartidos de la importación de productos.
 *
 * Este módulo es **isomorfo** a propósito: lo importan la acción del servidor
 * (para validar lo que llega del navegador) y el componente de revisión del
 * mapeo (para calcular la vista previa con el mismo código que después hará la
 * importación). Por eso aquí no hay nada de Node, ni `File`, ni acceso a red.
 */

import { z } from "zod";

/** Campos del producto a los que se puede apuntar una columna del archivo. */
export const PRODUCT_FIELDS = [
  "name",
  "sku",
  "description",
  "category",
  "price",
  "currency",
  "stock",
  "min_order_qty",
  "image_url",
] as const;

export type ProductField = (typeof PRODUCT_FIELDS)[number];

/** Destino de una columna: un campo del producto o nada. */
export type MappedField = ProductField | "ignore";

export const MAPPED_FIELDS = [...PRODUCT_FIELDS, "ignore"] as const;

/** Rótulo en español de cada destino, para la interfaz. */
export const FIELD_LABELS: Record<MappedField, string> = {
  name: "Nombre",
  sku: "SKU / código",
  description: "Descripción",
  category: "Categoría",
  price: "Precio",
  currency: "Moneda",
  stock: "Stock",
  min_order_qty: "Mínimo de pedido",
  image_url: "URL de imagen",
  ignore: "No importar",
};

/**
 * Celda tal como salió del archivo.
 *
 * Un CSV sólo produce texto. Una hoja de Excel puede traer el valor ya como
 * número, y esa distinción importa: un número nativo no debe volver a
 * interpretarse con reglas de separadores (si no, `1234.56` leído con coma
 * decimal se convertiría en `123456`). Es `string | number` y no un objeto
 * porque viaja en JSON entre la acción del servidor y el navegador.
 */
export type Cell = string | number;

/** Separador decimal del archivo. `auto` deja que lo deduzca el código. */
export type DecimalSeparator = "." | "," | "auto";

/** Decisión sobre una columna del archivo. */
export interface ColumnChoice {
  /** Posición de la columna en el archivo (0-based). */
  index: number;
  field: MappedField;
  /** 0 a 1. Lo que la propuesta cree acertado; se muestra al usuario. */
  confidence: number;
  /** Por qué se eligió ese campo (texto corto, se muestra en la revisión). */
  reason?: string;
}

/** Cómo se interpreta el archivo entero. Es lo que el usuario puede corregir. */
export interface MappingPlan {
  hasHeaderRow: boolean;
  decimal: DecimalSeparator;
  columns: ColumnChoice[];
}

/** De dónde salió el mapeo propuesto. Se muestra en la interfaz. */
export type MappingSource = "gemini" | "nombres";

/**
 * Validación de lo que el navegador manda de vuelta al confirmar.
 *
 * El plan llega como JSON en un campo oculto, así que es entrada de usuario:
 * se valida igual que cualquier otro campo del formulario.
 */
export const mappingPlanSchema = z.object({
  hasHeaderRow: z.boolean(),
  decimal: z.enum([".", ",", "auto"]),
  columns: z
    .array(
      z.object({
        index: z.number().int().min(0).max(999),
        field: z.enum(MAPPED_FIELDS),
        confidence: z.number().min(0).max(1).default(0),
        reason: z.string().max(240).optional(),
      }),
    )
    .max(1000),
});

/**
 * Lo que la acción de análisis devuelve al navegador.
 *
 * Deliberadamente no incluye el archivo entero: sólo la muestra que se necesita
 * para revisar el mapeo. Al confirmar, el navegador vuelve a enviar el archivo
 * junto con el plan corregido, así no hace falta guardar nada en el servidor
 * entre los dos pasos.
 */
export interface Analysis {
  fileName: string;
  /** Primeras filas del archivo **tal cual**, incluida la de encabezados. */
  sample: Cell[][];
  columnCount: number;
  /** Filas de datos detectadas en todo el archivo (aproximado si se recortó). */
  dataRowCount: number;
  plan: MappingPlan;
  source: MappingSource;
  /** Avisos para la interfaz (IA no disponible, varias hojas, recorte…). */
  notices: string[];
  /** JSON exacto que se envió a Google, o null si no se envió nada. */
  sentToGoogle: string | null;
  sheetNames: string[];
  sheetUsed: string;
  truncated: boolean;
}

/** Tope de columnas que se analizan. Más que esto no es una lista de precios. */
export const MAX_COLUMNS = 60;

/** Filas de muestra que se leen para proponer el mapeo y la vista previa. */
export const SAMPLE_ROWS = 5;

/** Tope de caracteres por celda en la muestra que sale del servidor. */
export const MAX_SAMPLE_CELL_CHARS = 120;

/** Tamaño máximo del archivo subido. Un .xlsx pesa más que el CSV equivalente. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/** Tope de filas de datos que se procesan de un archivo. */
export const MAX_IMPORT_ROWS = 5000;

/** Texto de una celda, recortado y sin espacios de sobra. */
export function cellText(cell: Cell | undefined, max = MAX_SAMPLE_CELL_CHARS): string {
  if (cell === undefined || cell === null) return "";
  const text = typeof cell === "number" ? String(cell) : cell;
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}
