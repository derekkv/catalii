/**
 * Propuesta de mapeo de columnas con Gemini.
 *
 * Qué hace la IA y qué no:
 *
 *  · **Sí**: mirar los nombres de las columnas y unas pocas filas de ejemplo y
 *    decir a qué campo del producto corresponde cada columna, con qué
 *    confianza, si la primera fila son encabezados y qué separador decimal
 *    parece usar el archivo.
 *  · **No**: tocar los datos. No transforma, no corrige, no completa y no
 *    devuelve ningún producto. La conversión la hace `mapping.ts` y el usuario
 *    confirma el mapeo antes de que se inserte nada.
 *
 * Qué se envía a Google: sólo el payload que arma `analysisPayload()` (los
 * encabezados y hasta 5 filas de muestra, con las celdas recortadas). Nunca el
 * archivo completo, ni el nombre del archivo, ni nada del negocio o del
 * usuario. `store: false` pide que la interacción no se guarde para consulta
 * posterior.
 *
 * Si algo falla —no hay clave, la API responde mal, tarda más de 10 s, o el
 * JSON no encaja con el esquema— esta función devuelve `plan: null` con un
 * motivo y quien llama se queda con la heurística de nombres. Un solo intento:
 * reintentar sólo alargaría la espera del usuario para acabar en el mismo
 * respaldo.
 *
 * API: `interactions.create` del SDK `@google/genai` (la `generateContent` de
 * `models.*` quedó como legacy). El SDK se carga con `import()` dinámico para
 * que no entre en el bundle de las demás rutas.
 */

import { z } from "zod";
import { withTimeout } from "@/lib/timeout";
import {
  MAPPED_FIELDS,
  MAX_SAMPLE_CELL_CHARS,
  SAMPLE_ROWS,
  type Cell,
  type ColumnChoice,
  type MappingPlan,
  cellText,
} from "./types";

/** Modelo por defecto. Configurable: la familia cambia cada pocos meses. */
const DEFAULT_MODEL = "gemini-3.8-flash";

/** Un solo intento y espera corta: detrás hay un usuario esperando. */
const TIMEOUT_MS = 10_000;

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

/** ¿Hay clave configurada? Sin ella no se llama a Google en absoluto. */
export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Lo único que sale de aquí hacia Google.
 *
 * Se devuelve como objeto para poder serializarlo y **mostrárselo al usuario**
 * tal cual en la pantalla de revisión: el aviso de que se envían encabezados y
 * filas de ejemplo deja de ser una promesa y pasa a ser verificable.
 */
export function analysisPayload(headers: string[], sample: Cell[][]) {
  return {
    columnas: headers.map((encabezado, indice) => ({
      indice,
      encabezado: cellText(encabezado, MAX_SAMPLE_CELL_CHARS),
    })),
    filas: sample
      .slice(0, SAMPLE_ROWS)
      .map((row) => headers.map((_, i) => cellText(row[i], MAX_SAMPLE_CELL_CHARS))),
  };
}

const SYSTEM = [
  "Eres un asistente que mapea columnas de listas de precios de mayoristas a los campos de un catálogo.",
  "Recibes los encabezados de un archivo y unas pocas filas de ejemplo.",
  "Tu única tarea es decidir a qué campo corresponde cada columna.",
  "No transformes, corrijas ni inventes datos: no devuelvas valores de las filas.",
  "Campos posibles:",
  "- name: nombre o descripción corta del producto (obligatorio en el catálogo).",
  "- sku: código, clave, referencia o código de barras.",
  "- description: descripción larga, detalle u observaciones.",
  "- category: categoría, familia, línea o rubro.",
  "- price: precio de venta unitario (P.V.P., precio de lista, importe).",
  "- currency: código o símbolo de moneda.",
  "- stock: existencias, inventario o cantidad disponible.",
  "- min_order_qty: mínimo de pedido o unidades por bulto.",
  "- image_url: URL de una foto del producto.",
  "- ignore: la columna no corresponde a ninguno de los anteriores.",
  "Usa cada campo como máximo en una columna; si dudas entre dos, elige la mejor y pon ignore en la otra.",
  "Si una columna numérica podría ser precio o stock, fíjate en los decimales y en los símbolos de moneda.",
  "confidence va de 0 a 1 y debe reflejar tu duda real: el usuario revisa el mapeo y ve ese número.",
  "reason: una frase corta en español, de qué te basaste.",
  "decimal_separator: el carácter que separa los decimales en las cifras del archivo ('.' o ','), o 'auto' si no se puede saber.",
  "has_header_row: true si la primera fila de ejemplo son los nombres de las columnas y no datos.",
].join("\n");

/** Esquema de salida estructurada que se le exige al modelo. */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    has_header_row: { type: "boolean" },
    decimal_separator: { type: "string", enum: [".", ",", "auto"] },
    columns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          field: { type: "string", enum: [...MAPPED_FIELDS] },
          confidence: { type: "number" },
          reason: { type: "string" },
        },
        required: ["index", "field", "confidence"],
      },
    },
  },
  required: ["has_header_row", "columns"],
} as const;

/** Lo que se acepta como respuesta. Cualquier otra cosa activa el respaldo. */
const responseSchema = z.object({
  has_header_row: z.boolean(),
  decimal_separator: z.enum([".", ",", "auto"]).optional(),
  columns: z
    .array(
      z.object({
        index: z.number().int().min(0),
        field: z.enum(MAPPED_FIELDS),
        confidence: z.number().min(0).max(1).catch(0.5),
        reason: z.string().max(240).optional(),
      }),
    )
    .min(1),
});

export type GeminiOutcome =
  | { plan: MappingPlan; sent: string }
  | { plan: null; sent: string | null; reason: string };

/**
 * Normaliza la respuesta del modelo a un plan para TODAS las columnas.
 *
 * El modelo puede devolver columnas de más, de menos, repetidas o con índices
 * fuera de rango. Nada de eso se acepta a ciegas: se construye el plan
 * recorriendo las columnas reales del archivo y las sobras se descartan. Si un
 * campo viene repetido gana la primera columna.
 */
function toPlan(
  parsed: z.infer<typeof responseSchema>,
  columnCount: number,
): MappingPlan | null {
  const byIndex = new Map<number, (typeof parsed.columns)[number]>();
  for (const c of parsed.columns) {
    if (c.index < 0 || c.index >= columnCount) continue;
    if (!byIndex.has(c.index)) byIndex.set(c.index, c);
  }
  if (byIndex.size === 0) return null;

  const taken = new Set<string>();
  const columns: ColumnChoice[] = [];
  for (let index = 0; index < columnCount; index++) {
    const choice = byIndex.get(index);
    if (!choice || choice.field === "ignore" || taken.has(choice.field)) {
      columns.push({
        index,
        field: "ignore",
        confidence: 0,
        reason: choice && taken.has(choice.field)
          ? "Ese campo ya lo toma una columna anterior."
          : undefined,
      });
      continue;
    }
    taken.add(choice.field);
    columns.push({
      index,
      field: choice.field,
      confidence: choice.confidence,
      reason: choice.reason,
    });
  }

  // Un mapeo sin nombre no sirve para importar: mejor caer al respaldo, que
  // además explica al usuario que tiene que elegir las columnas a mano.
  if (!taken.has("name")) return null;

  return {
    hasHeaderRow: parsed.has_header_row,
    decimal: parsed.decimal_separator ?? "auto",
    columns,
  };
}

/**
 * Interpreta el texto que devolvió el modelo.
 *
 * Separado de la llamada a propósito: es la parte que puede fallar de formas
 * raras (JSON roto, campos que no son los pedidos, índices inventados) y así
 * se puede ejercitar sin red ni clave. Devuelve `null` ante cualquier cosa que
 * no encaje, y quien llama se queda con la heurística.
 */
export function planFromResponseText(
  text: string,
  columnCount: number,
): { plan: MappingPlan } | { plan: null; reason: string } {
  const trimmed = text.trim();
  if (trimmed === "") return { plan: null, reason: "respuesta-vacia" };

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return { plan: null, reason: "respuesta-no-json" };
  }

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return { plan: null, reason: "respuesta-inesperada" };

  const plan = toPlan(parsed.data, columnCount);
  if (!plan) return { plan: null, reason: "mapeo-incompleto" };
  return { plan };
}

/**
 * Pide a Gemini una propuesta de mapeo.
 *
 * No lanza nunca: cualquier fallo vuelve como `{ plan: null, reason }` para
 * que quien llama siga con la heurística.
 */
export async function proposeMapping(
  headers: string[],
  sample: Cell[][],
): Promise<GeminiOutcome> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { plan: null, sent: null, reason: "sin-clave" };

  const payload = analysisPayload(headers, sample);
  const sent = JSON.stringify(payload, null, 2);

  try {
    const call = (async () => {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      return ai.interactions.create(
        {
          model: geminiModel(),
          system_instruction: SYSTEM,
          input: `Archivo a mapear:\n${sent}`,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
          },
          // Que Google no conserve la interacción para consulta posterior.
          store: false,
        },
        { timeout_ms: TIMEOUT_MS, retries: { strategy: "none" } },
      );
    })();

    // `timeout_ms` acota la llamada HTTP; esto acota la operación completa,
    // incluida la carga del módulo. En Workers una promesa colgada se come
    // los límites de duración del request.
    const interaction = await withTimeout(call, TIMEOUT_MS, "Gemini");

    const result = planFromResponseText(interaction.output_text ?? "", headers.length);
    return result.plan ? { plan: result.plan, sent } : { plan: null, sent, reason: result.reason };
  } catch (err) {
    // Incluye el timeout, los errores de red y los HTTP del SDK. Se registra
    // el tipo y el mensaje, nunca el payload ni la clave.
    console.error(
      "[import/gemini]",
      err instanceof Error ? `${err.name}: ${err.message}` : "error desconocido",
    );
    return { plan: null, sent, reason: "error-api" };
  }
}

/** Texto para la interfaz según por qué no se pudo usar la IA. */
export const FALLBACK_NOTICE: Record<string, string> = {
  "sin-clave":
    "El análisis con IA no está configurado en este servidor: el mapeo se propuso por el nombre de las columnas.",
  "respuesta-vacia":
    "La IA no devolvió una propuesta: el mapeo se propuso por el nombre de las columnas.",
  "respuesta-no-json":
    "La IA devolvió una respuesta ilegible: el mapeo se propuso por el nombre de las columnas.",
  "respuesta-inesperada":
    "La respuesta de la IA no tenía el formato esperado: el mapeo se propuso por el nombre de las columnas.",
  "mapeo-incompleto":
    "La IA no identificó la columna del nombre: el mapeo se propuso por el nombre de las columnas.",
  "error-api":
    "No se pudo consultar la IA (falló o tardó demasiado): el mapeo se propuso por el nombre de las columnas.",
};
