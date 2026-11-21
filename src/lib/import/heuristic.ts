/**
 * Mapeo por nombre de columna: el camino de respaldo.
 *
 * Es el que corre siempre que Gemini no esté disponible (sin clave, con la API
 * caída, lenta o devolviendo algo que no encaja) y, en la práctica, el que más
 * se va a usar. La importación nunca depende de que la IA responda.
 *
 * Respecto a la heurística que había antes en la acción, cambia en dos cosas:
 * el nombre se normaliza (sin acentos ni puntuación, así "P.V.P." y "Artículo"
 * se reconocen) y el resultado es un `MappingPlan` revisable por el usuario en
 * vez de una decisión invisible.
 */

import {
  PRODUCT_FIELDS,
  type Cell,
  type ColumnChoice,
  type MappingPlan,
  type ProductField,
  cellText,
} from "./types";

/** "P.V.P. (USD)" → "pvpusd"; "Artículo" → "articulo". */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Nombres exactos conocidos. Se consultan antes que los parciales para que
 * "precio" no gane sobre "preciominimo" ni "descripcion" sobre "nombre".
 */
const EXACT: Record<string, ProductField> = {
  // Nombre
  name: "name",
  nombre: "name",
  producto: "name",
  articulo: "name",
  item: "name",
  denominacion: "name",
  concepto: "name",
  detalle: "name",
  // SKU
  sku: "sku",
  codigo: "sku",
  cod: "sku",
  clave: "sku",
  referencia: "sku",
  ref: "sku",
  codigodebarras: "sku",
  codbarras: "sku",
  ean: "sku",
  // Descripción
  description: "description",
  descripcion: "description",
  descripcionlarga: "description",
  observaciones: "description",
  notas: "description",
  // Categoría
  category: "category",
  categoria: "category",
  familia: "category",
  rubro: "category",
  linea: "category",
  grupo: "category",
  departamento: "category",
  // Precio
  price: "price",
  precio: "price",
  pvp: "price",
  pvpu: "price",
  importe: "price",
  valor: "price",
  monto: "price",
  preciounitario: "price",
  precioventa: "price",
  preciopublico: "price",
  preciolista: "price",
  unitprice: "price",
  // Moneda
  currency: "currency",
  moneda: "currency",
  divisa: "currency",
  // Stock
  stock: "stock",
  existencia: "stock",
  existencias: "stock",
  inventario: "stock",
  cantidad: "stock",
  disponible: "stock",
  disponibles: "stock",
  saldo: "stock",
  qty: "stock",
  quantity: "stock",
  // Mínimo de pedido
  minorderqty: "min_order_qty",
  minimo: "min_order_qty",
  minimopedido: "min_order_qty",
  pedidominimo: "min_order_qty",
  cantidadminima: "min_order_qty",
  minimodecompra: "min_order_qty",
  bulto: "min_order_qty",
  // Imagen
  imageurl: "image_url",
  image: "image_url",
  imagen: "image_url",
  foto: "image_url",
  urlimagen: "image_url",
  urldeimagen: "image_url",
  urlfoto: "image_url",
};

/**
 * Coincidencias parciales, en orden de prioridad: la primera que aparezca
 * dentro del nombre normalizado decide. Lo específico va antes que lo general
 * ("preciominimo" antes que "precio", "minimo" antes que "cantidad").
 */
const PARTIAL: [string, ProductField][] = [
  ["minimodepedido", "min_order_qty"],
  ["pedidominimo", "min_order_qty"],
  ["cantidadminima", "min_order_qty"],
  ["minimo", "min_order_qty"],
  ["minorder", "min_order_qty"],
  ["urlimagen", "image_url"],
  ["imagen", "image_url"],
  ["imageurl", "image_url"],
  ["foto", "image_url"],
  ["moneda", "currency"],
  ["divisa", "currency"],
  ["currency", "currency"],
  ["existencia", "stock"],
  ["inventario", "stock"],
  ["stock", "stock"],
  ["disponib", "stock"],
  ["preciounitario", "price"],
  ["precio", "price"],
  ["pvp", "price"],
  ["price", "price"],
  ["categoria", "category"],
  ["category", "category"],
  ["familia", "category"],
  ["descripcion", "description"],
  ["description", "description"],
  ["codigo", "sku"],
  ["sku", "sku"],
  ["referencia", "sku"],
  ["nombre", "name"],
  ["articulo", "name"],
  ["producto", "name"],
  ["name", "name"],
];

/** Campo al que apunta un nombre de columna, o null si no se reconoce. */
export function fieldFromHeader(header: string): ProductField | null {
  const key = normalizeHeader(header);
  if (key === "") return null;
  if (EXACT[key]) return EXACT[key];
  for (const [needle, field] of PARTIAL) {
    if (key.includes(needle)) return field;
  }
  return null;
}

/** ¿La celda es texto que no parece una cifra ni una fecha? */
function looksLikeLabel(cell: Cell | undefined): boolean {
  if (typeof cell === "number") return false;
  const text = cellText(cell);
  if (text === "") return false;
  return !/^[\d\s.,$€%/:-]+$/.test(text);
}

/**
 * ¿La primera fila son encabezados?
 *
 * Se da por cierto si alguna de sus celdas tiene un nombre conocido o si la
 * fila entera es texto (ninguna cifra). Un archivo que empieza directo con
 * datos suele traer el precio o el stock como número en la primera fila.
 */
export function looksLikeHeaderRow(row: Cell[]): boolean {
  const filled = row.filter((c) => cellText(c) !== "");
  if (filled.length === 0) return false;
  if (filled.some((c) => fieldFromHeader(cellText(c)) !== null)) return true;
  return filled.every(looksLikeLabel);
}

/**
 * Propone un mapeo mirando sólo los nombres de las columnas.
 *
 * Si un campo aparece en dos columnas gana la primera; la segunda queda sin
 * asignar (y el usuario puede cambiarla en la revisión). Sin encabezados
 * reconocibles, todas las columnas quedan en "No importar": adivinar por
 * posición sería peor que pedir que el usuario las elija.
 */
export function heuristicPlan(rows: Cell[][]): MappingPlan {
  const first = rows[0] ?? [];
  const hasHeaderRow = looksLikeHeaderRow(first);
  const width = rows.reduce((max, r) => Math.max(max, r.length), 0);

  const taken = new Set<ProductField>();
  const columns: ColumnChoice[] = [];

  for (let index = 0; index < width; index++) {
    const header = hasHeaderRow ? cellText(first[index]) : "";
    const field = header === "" ? null : fieldFromHeader(header);
    if (field === null || taken.has(field)) {
      columns.push({
        index,
        field: "ignore",
        confidence: 0,
        reason: taken.has(field as ProductField)
          ? "Ese campo ya lo toma una columna anterior."
          : hasHeaderRow
            ? "Nombre de columna no reconocido."
            : "El archivo no trae encabezados reconocibles.",
      });
      continue;
    }
    taken.add(field);
    columns.push({
      index,
      field,
      // Nombre exacto conocido o coincidencia parcial: se distingue porque la
      // parcial acierta menos (p. ej. "precio con iva" → precio).
      confidence: EXACT[normalizeHeader(header)] ? 0.9 : 0.6,
      reason: `Por el nombre de la columna ("${header}").`,
    });
  }

  return { hasHeaderRow, decimal: "auto", columns };
}

/** Campos a los que apunta el plan, para avisos de la interfaz. */
export function mappedFields(plan: MappingPlan): Set<ProductField> {
  const set = new Set<ProductField>();
  for (const c of plan.columns) {
    if (c.field !== "ignore" && (PRODUCT_FIELDS as readonly string[]).includes(c.field)) {
      set.add(c.field);
    }
  }
  return set;
}
