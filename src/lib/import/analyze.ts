/**
 * Análisis del archivo: leerlo, proponer un mapeo y reunir los avisos.
 *
 * Orquesta los tres pasos y es donde vive la regla de degradación: se intenta
 * Gemini y, ante cualquier problema, se usa la heurística de nombres. El
 * resultado es siempre un plan utilizable, nunca un error por culpa de la IA.
 */

import { heuristicPlan } from "./heuristic";
import { FALLBACK_NOTICE, geminiConfigured, proposeMapping } from "./gemini";
import { readTable } from "./read-file";
import {
  MAX_IMPORT_ROWS,
  SAMPLE_ROWS,
  type Analysis,
  type Cell,
  type MappingPlan,
  type MappingSource,
  cellText,
} from "./types";

export type AnalyzeResult = { ok: true; analysis: Analysis } | { ok: false; error: string };

/** Encabezados para enviar a Gemini: el texto de la primera fila, o "". */
function headerLabels(rows: Cell[][], hasHeaderRow: boolean, width: number): string[] {
  const first = rows[0] ?? [];
  return Array.from({ length: width }, (_, i) => (hasHeaderRow ? cellText(first[i]) : ""));
}

export async function analyzeFile(file: File): Promise<AnalyzeResult> {
  const read = await readTable(file);
  if (!read.ok) return { ok: false, error: read.error };

  const { rows, sheetNames, sheetUsed, truncated } = read.table;
  const width = rows.reduce((max, r) => Math.max(max, r.length), 0);
  if (width === 0) return { ok: false, error: "El archivo no tiene columnas." };

  // La heurística se calcula SIEMPRE: además de ser el respaldo, su detección
  // de encabezados es la que decide qué se le manda a Gemini como nombres.
  const fallback = heuristicPlan(rows);
  const sample = rows.slice(0, SAMPLE_ROWS + 1);
  const notices: string[] = [];

  let plan: MappingPlan = fallback;
  let source: MappingSource = "nombres";
  let sentToGoogle: string | null = null;

  if (geminiConfigured()) {
    const headers = headerLabels(rows, fallback.hasHeaderRow, width);
    const outcome = await proposeMapping(headers, sample.slice(fallback.hasHeaderRow ? 1 : 0));
    sentToGoogle = outcome.sent;
    if (outcome.plan) {
      plan = outcome.plan;
      source = "gemini";
    } else {
      notices.push(FALLBACK_NOTICE[outcome.reason] ?? FALLBACK_NOTICE["error-api"]);
    }
  } else {
    notices.push(FALLBACK_NOTICE["sin-clave"]);
  }

  if (sheetNames.length > 1) {
    notices.push(
      `El archivo tiene ${sheetNames.length} hojas; sólo se importa la primera ("${sheetUsed}").`,
    );
  }
  if (truncated) {
    notices.push(`El archivo trae más de ${MAX_IMPORT_ROWS} filas; se importarán las primeras.`);
  }
  if (!plan.columns.some((c) => c.field === "name")) {
    notices.push(
      "No se reconoció la columna del nombre: elígela abajo, es el único campo obligatorio.",
    );
  }

  const dataRowCount = Math.max(0, rows.length - (plan.hasHeaderRow ? 1 : 0));

  return {
    ok: true,
    analysis: {
      fileName: file.name,
      sample,
      columnCount: width,
      dataRowCount,
      plan,
      source,
      notices,
      sentToGoogle,
      sheetNames,
      sheetUsed,
      truncated,
    },
  };
}
