/**
 * Conversión de cifras del archivo a un número canónico.
 *
 * La IA puede *decir* qué separador decimal usa el archivo, pero la conversión
 * se hace aquí, con reglas explícitas y comprobables, y el resultado se le
 * muestra al usuario antes de importar. El caso que motiva todo esto es la
 * lista de precios en español: `1.234,56` son mil doscientos treinta y cuatro
 * con cincuenta y seis, no uno con veintitrés.
 *
 * Devuelve **texto**, no número, porque quien valida es `productSchema`
 * (`z.coerce.number()`): así un valor que no se pueda leer llega entero al
 * esquema y el usuario ve "El precio debe ser un número" en la fila que
 * corresponde, en vez de un 0 silencioso.
 */

import type { Cell, DecimalSeparator } from "./types";

/** Caracteres que pueden formar parte de una cifra escrita a mano. */
const SEPARATORS = /[.,]/;

/**
 * Deduce el separador decimal de un texto cuando el usuario (o la IA) no lo
 * fijó. Reglas, en orden:
 *
 *  1. Si aparecen punto y coma, el **último** es el decimal: `1.234,56` → coma,
 *     `1,234.56` → punto. Es la regla que no falla nunca.
 *  2. Si sólo aparece uno y aparece varias veces, es de miles: `1.234.567`.
 *  3. Si sólo aparece uno y una vez, se mira cuántos dígitos lo siguen: con
 *     exactamente tres se lee como separador de miles (`1,234` → 1234); con
 *     cualquier otra cantidad, como decimal (`12,50` → 12.5).
 *
 * El punto 3 es una apuesta: `1,500` puede ser mil quinientos o uno y medio.
 * Por eso la interfaz deja fijar el separador a mano y muestra el valor ya
 * interpretado en la vista previa.
 */
function detectDecimal(text: string): "." | "," {
  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");

  if (lastDot >= 0 && lastComma >= 0) return lastDot > lastComma ? "." : ",";

  const sep = lastDot >= 0 ? "." : lastComma >= 0 ? "," : null;
  if (sep === null) return ".";

  const occurrences = text.split(sep).length - 1;
  const other = sep === "." ? "," : ".";
  if (occurrences > 1) return other;

  const after = text.slice(text.lastIndexOf(sep) + 1);
  return /^\d{3}$/.test(after) ? other : sep;
}

/**
 * Normaliza una cifra a notación con punto decimal.
 *
 * @param cell    Celda del archivo. Si viene como número (hoja de cálculo) se
 *                usa tal cual: ya no hay ambigüedad de separadores.
 * @param decimal Separador decimal declarado, o "auto" para deducirlo.
 * @returns Texto apto para `z.coerce.number()`, "" si la celda está vacía, o
 *          el texto original si no contiene ninguna cifra legible (para que
 *          sea el esquema quien dé el mensaje de error).
 */
export function toNumericText(cell: Cell | undefined, decimal: DecimalSeparator): string {
  if (cell === undefined || cell === null) return "";
  if (typeof cell === "number") return Number.isFinite(cell) ? String(cell) : "";

  const raw = cell.trim();
  if (raw === "") return "";

  const negative = /^\(.*\)$/.test(raw) || raw.startsWith("-");

  // Fuera símbolos de moneda, letras, espacios (incluido el fino de los miles)
  // y el apóstrofo que usan algunas hojas suizas como separador de miles.
  const digitsAndSeparators = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(digitsAndSeparators)) return raw;

  const sep = decimal === "auto" ? detectDecimal(digitsAndSeparators) : decimal;
  const thousands = sep === "." ? "," : ".";

  let normalized = digitsAndSeparators.split(thousands).join("");
  if (sep === ",") normalized = normalized.split(",").join(".");

  // Más de un punto decimal es un número mal escrito: se deja así para que
  // `z.coerce.number()` lo rechace con su mensaje en vez de inventar un valor.
  if (normalized.split(".").length > 2) return raw;
  if (!SEPARATORS.test(normalized) && !/^\d+$/.test(normalized)) return raw;

  return negative ? `-${normalized}` : normalized;
}

/**
 * Normaliza un código de moneda a tres letras.
 *
 * Si no se puede leer como código ISO devuelve "" y el esquema aplica el
 * predeterminado (USD). La moneda resultante aparece en la vista previa, así
 * que el usuario ve con qué se va a guardar antes de confirmar.
 */
export function toCurrencyCode(cell: Cell | undefined): string {
  const raw = typeof cell === "number" ? String(cell) : (cell ?? "");
  const text = raw.trim();
  if (text === "") return "";
  if (text.includes("€")) return "EUR";
  if (text.includes("£")) return "GBP";
  const letters = text.replace(/[^A-Za-z]/g, "").toUpperCase();
  return letters.length === 3 ? letters : "";
}
