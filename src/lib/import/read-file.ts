/**
 * Lectura del archivo subido a una matriz de celdas.
 *
 * Acepta CSV (y texto delimitado) y hojas de cálculo (.xlsx, .xls, .ods). No
 * decide nada sobre el significado de las columnas: eso lo hace `gemini.ts` o
 * `heuristic.ts` y lo confirma el usuario. Aquí sólo se saca la rejilla.
 *
 * Las dos librerías se cargan con `import()` dinámico: el lector de hojas de
 * cálculo (SheetJS) pesa bastante y no tiene por qué entrar en el bundle de
 * una importación de CSV, ni en el de ninguna otra ruta.
 */

import {
  MAX_COLUMNS,
  MAX_IMPORT_ROWS,
  type Cell,
} from "./types";

export interface SheetTable {
  /** Filas del archivo, incluida la de encabezados si existe. */
  rows: Cell[][];
  /** Nombres de todas las hojas (una sola para un CSV). */
  sheetNames: string[];
  /** Hoja que se usó: siempre la primera. */
  sheetUsed: string;
  /** Se alcanzó el tope de filas y el resto se ignoró. */
  truncated: boolean;
}

export type ReadResult = { ok: true; table: SheetTable } | { ok: false; error: string };

/** Extensiones que se leen como hoja de cálculo. */
const SPREADSHEET = /\.(xlsx|xlsm|xlsb|xls|ods|fods)$/i;
const DELIMITED = /\.(csv|tsv|txt)$/i;

/** Tipos MIME de hoja de cálculo que mandan los navegadores. */
const SPREADSHEET_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.ms-excel.sheet.binary.macroenabled.12",
]);

function isSpreadsheet(file: File): boolean {
  if (SPREADSHEET.test(file.name)) return true;
  if (DELIMITED.test(file.name)) return false;
  return SPREADSHEET_MIME.has(file.type);
}

/** Recorta la matriz a los topes de filas y columnas. */
function clamp(rows: Cell[][]): { rows: Cell[][]; truncated: boolean } {
  const truncated = rows.length > MAX_IMPORT_ROWS + 1;
  const limited = truncated ? rows.slice(0, MAX_IMPORT_ROWS + 1) : rows;
  return { rows: limited.map((r) => r.slice(0, MAX_COLUMNS)), truncated };
}

/** Quita las filas totalmente vacías del final (relleno típico de Excel). */
function trimTrailingEmpty(rows: Cell[][]): Cell[][] {
  let end = rows.length;
  while (end > 0) {
    const row = rows[end - 1] ?? [];
    const empty = row.every((c) => (typeof c === "number" ? false : String(c ?? "").trim() === ""));
    if (!empty) break;
    end--;
  }
  return rows.slice(0, end);
}

async function readDelimited(file: File): Promise<ReadResult> {
  const { default: Papa } = await import("papaparse");
  const text = await file.text();
  // `header: false`: los encabezados no se dan por supuestos, se detectan
  // después. `dynamicTyping` desactivado a propósito: en un CSV todo es texto
  // y la conversión de cifras es nuestra (ver numbers.ts).
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
  });
  // Los errores de delimitador se dan por campo y no impiden leer el resto;
  // sólo se rechaza el archivo si no salió ninguna fila.
  const rows = trimTrailingEmpty((result.data ?? []).map((r) => r.map((c) => c ?? "")));
  if (rows.length === 0) {
    return { ok: false, error: "El archivo no tiene filas legibles." };
  }
  const { rows: limited, truncated } = clamp(rows);
  return {
    ok: true,
    table: { rows: limited, sheetNames: [file.name], sheetUsed: file.name, truncated },
  };
}

async function readSpreadsheet(file: File): Promise<ReadResult> {
  const XLSX = await import("xlsx");
  const buffer = new Uint8Array(await file.arrayBuffer());
  let book;
  try {
    book = XLSX.read(buffer, { type: "array", cellDates: true, cellText: false });
  } catch {
    return { ok: false, error: "No se pudo leer la hoja de cálculo. ¿El archivo está completo?" };
  }
  const sheetNames = book.SheetNames ?? [];
  const sheetUsed = sheetNames[0];
  if (!sheetUsed) return { ok: false, error: "El archivo no tiene hojas." };
  const sheet = book.Sheets[sheetUsed];
  if (!sheet) return { ok: false, error: "No se pudo leer la primera hoja." };

  // `raw: true` deja los números como números: una celda numérica de Excel no
  // tiene ambigüedad de separadores y no debe volver a interpretarse.
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: "",
  });

  const rows: Cell[][] = grid.map((row) =>
    (row ?? []).map((value): Cell => {
      if (typeof value === "number") return value;
      if (typeof value === "boolean") return value ? "true" : "false";
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return value === null || value === undefined ? "" : String(value);
    }),
  );

  const cleaned = trimTrailingEmpty(rows);
  if (cleaned.length === 0) {
    return { ok: false, error: "La primera hoja está vacía." };
  }
  const { rows: limited, truncated } = clamp(cleaned);
  return { ok: true, table: { rows: limited, sheetNames, sheetUsed, truncated } };
}

/** Lee el archivo subido. El tamaño ya lo comprobó la acción. */
export async function readTable(file: File): Promise<ReadResult> {
  try {
    return isSpreadsheet(file) ? await readSpreadsheet(file) : await readDelimited(file);
  } catch (err) {
    console.error("[import] lectura del archivo:", err);
    return { ok: false, error: "No se pudo leer el archivo." };
  }
}
