"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Loader2, Sparkles, Upload } from "lucide-react";
import { analyzeImportFile, importProducts } from "./actions";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { columnLabels, parseRows } from "@/lib/import/mapping";
import {
  FIELD_LABELS,
  MAPPED_FIELDS,
  SAMPLE_ROWS,
  cellText,
  type Analysis,
  type DecimalSeparator,
  type MappedField,
  type MappingPlan,
} from "@/lib/import/types";
import { formatMoney } from "@/lib/utils";

/**
 * Importación de productos en dos pasos.
 *
 *   1. Elegir archivo (CSV o hoja de cálculo). Aquí se avisa, antes de subir
 *      nada, de qué se envía a Google para proponer el mapeo.
 *   2. Revisar el mapeo propuesto, corregirlo y ver la vista previa de las
 *      primeras filas ya interpretadas. Nada se guarda hasta confirmar.
 *
 * El paso 2 no es opcional ni se puede saltar: si la IA confunde precio con
 * stock y nadie lo revisa, el mayorista publica su catálogo mal. La vista
 * previa se calcula con el MISMO código que usará el servidor al importar
 * (`parseRows`), así que lo que se ve es lo que se va a guardar.
 */

const CSV_TEMPLATE =
  "name,sku,price,stock,category,description,image_url\n" +
  "Refresco de cola 600 ml,RC600,12.50,240,Bebidas,Retornable,\n" +
  "Galletas surtidas 170 g,GS170,18.00,80,Abarrotes,,\n";

const ACCEPT = [
  ".csv",
  ".tsv",
  ".txt",
  ".xlsx",
  ".xlsm",
  ".xls",
  ".ods",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.oasis.opendocument.spreadsheet",
].join(",");

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [plan, setPlan] = useState<MappingPlan | null>(null);
  const [error, setError] = useState("");
  const [analyzing, startAnalyze] = useTransition();
  const [importing, startImport] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function reset() {
    setFile(null);
    setAnalysis(null);
    setPlan(null);
    setError("");
  }

  function close() {
    reset();
    onClose();
  }

  function analyze(selected: File) {
    setError("");
    const data = new FormData();
    data.set("file", selected);
    startAnalyze(async () => {
      const result = await analyzeImportFile(data);
      if (!result.ok || !result.analysis) {
        setError(result.error ?? "No se pudo analizar el archivo.");
        return;
      }
      setAnalysis(result.analysis);
      setPlan(result.analysis.plan);
    });
  }

  function runImport() {
    if (!file || !plan) return;
    setError("");
    const data = new FormData();
    data.set("file", file);
    data.set("plan", JSON.stringify(plan));
    startImport(async () => {
      const result = await importProducts(data);
      if (!result.ok) {
        setError(result.error ?? "No se pudieron importar los productos.");
        return;
      }
      toast(result.message ?? "Productos importados.", { tone: "success" });
      close();
      router.refresh();
    });
  }

  const reviewing = analysis !== null && plan !== null;

  return (
    <Modal
      open={open}
      onClose={close}
      className={reviewing ? "sm:max-w-3xl" : undefined}
      title={reviewing ? "Revisar las columnas" : "Importar productos"}
      description={
        reviewing
          ? "Comprueba a qué campo va cada columna antes de guardar. Puedes cambiar cualquiera."
          : "CSV o Excel (.xlsx, .xls, .ods). Máximo 2 MB."
      }
    >
      {reviewing ? (
        <ReviewStep
          analysis={analysis}
          plan={plan}
          onPlanChange={setPlan}
          error={error}
          importing={importing}
          onBack={reset}
          onConfirm={runImport}
        />
      ) : (
        <FileStep
          file={file}
          analyzing={analyzing}
          error={error}
          onPick={(picked) => {
            setFile(picked);
            setError("");
          }}
          onSubmit={() => file && analyze(file)}
          onCancel={close}
        />
      )}
    </Modal>
  );
}

/* ── Paso 1: archivo ──────────────────────────────────────────────────────── */

function FileStep({
  file,
  analyzing,
  error,
  onPick,
  onSubmit,
  onCancel,
}: {
  file: File | null;
  analyzing: boolean;
  error: string;
  onPick: (file: File | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <Label htmlFor="import-file">Archivo</Label>
        <label
          htmlFor="import-file"
          className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-theme-sm)] border border-dashed border-border bg-muted/50 p-4 text-sm transition-colors hover:bg-muted"
        >
          <Upload className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {file ? (
              <span className="truncate font-semibold">{file.name}</span>
            ) : (
              <>
                <span className="font-semibold">Elegir archivo</span>
                <span className="block text-xs text-muted-foreground">
                  Cualquier lista de precios: no hace falta que las columnas se llamen de
                  una forma concreta.
                </span>
              </>
            )}
          </span>
          <input
            ref={inputRef}
            id="import-file"
            type="file"
            name="file"
            accept={ACCEPT}
            required
            className="sr-only"
            aria-describedby="import-privacy"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {/* Aviso obligatorio: tiene que coincidir con la política de privacidad. */}
      <p
        id="import-privacy"
        className="rounded-[var(--radius-theme-sm)] border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground"
      >
        <Sparkles className="mr-1 inline size-3.5" aria-hidden="true" />
        Para adivinar qué columna es qué, <strong>los nombres de las columnas y hasta{" "}
        {SAMPLE_ROWS} filas de ejemplo</strong> se envían a Google (Gemini) para analizarlas.
        No se envía el archivo completo ni ningún dato de tu cuenta, y en el paso
        siguiente podrás ver exactamente qué se envió. Si el análisis con IA no está
        disponible, las columnas se reconocen por su nombre y la importación funciona
        igual.
      </p>

      <a
        href={templateHref}
        download="catalii-plantilla-productos.csv"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <FileDown className="size-4" aria-hidden="true" /> Descargar plantilla de ejemplo
      </a>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-theme-sm)] bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={analyzing || !file} className="gap-2">
          {analyzing && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {analyzing ? "Analizando…" : "Continuar"}
        </Button>
      </div>
    </form>
  );
}

/* ── Paso 2: revisión del mapeo ───────────────────────────────────────────── */

function confidenceBadge(confidence: number) {
  if (confidence >= 0.8) return { tone: "success" as const, text: "confianza alta" };
  if (confidence >= 0.5) return { tone: "warning" as const, text: "confianza media" };
  return { tone: "danger" as const, text: "sin reconocer" };
}

function ReviewStep({
  analysis,
  plan,
  onPlanChange,
  error,
  importing,
  onBack,
  onConfirm,
}: {
  analysis: Analysis;
  plan: MappingPlan;
  onPlanChange: (plan: MappingPlan) => void;
  error: string;
  importing: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const labels = useMemo(() => columnLabels(analysis.sample, plan), [analysis.sample, plan]);
  const preview = useMemo(
    () => parseRows(analysis.sample, plan, SAMPLE_ROWS),
    [analysis.sample, plan],
  );
  const dataRows = analysis.sample.slice(plan.hasHeaderRow ? 1 : 0);
  const hasName = plan.columns.some((c) => c.field === "name");

  /**
   * Un campo, una columna: al asignar un campo que ya estaba en otra columna,
   * la anterior pasa a "No importar". Evita el estado ambiguo de dos columnas
   * peleando por el precio.
   */
  function setField(index: number, field: MappedField) {
    onPlanChange({
      ...plan,
      columns: plan.columns.map((c) => {
        if (c.index === index) return { ...c, field, confidence: 1, reason: undefined };
        if (field !== "ignore" && c.field === field) {
          return { ...c, field: "ignore", confidence: 0, reason: undefined };
        }
        return c;
      }),
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Origen del mapeo y avisos ────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge tone={analysis.source === "gemini" ? "primary" : "muted"}>
            {analysis.source === "gemini"
              ? "Mapeo propuesto por Gemini"
              : "Mapeo por nombre de columna"}
          </Badge>
          <span className="t-small text-muted-foreground">
            {analysis.fileName} · {analysis.columnCount} columnas ·{" "}
            {analysis.dataRowCount} filas de datos
          </span>
        </div>
        {analysis.notices.map((notice) => (
          <p
            key={notice}
            className="rounded-[var(--radius-theme-sm)] border-l-2 border-warning bg-warning/10 px-3 py-2 text-xs text-foreground"
          >
            {notice}
          </p>
        ))}
      </div>

      {/* ── Cómo se lee el archivo ───────────────────────────────────────── */}
      <fieldset className="space-y-3 rounded-[var(--radius-theme-sm)] border border-border p-3">
        <legend className="t-label px-1 text-muted-foreground">Lectura del archivo</legend>
        <div className="flex items-start gap-2">
          <input
            id="has-header"
            type="checkbox"
            checked={plan.hasHeaderRow}
            onChange={(e) => onPlanChange({ ...plan, hasHeaderRow: e.target.checked })}
            className="mt-0.5 size-4 cursor-pointer accent-[var(--primary)]"
          />
          <label htmlFor="has-header" className="cursor-pointer text-sm">
            La primera fila son los nombres de las columnas
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="decimal-sep" className="t-small text-muted-foreground">
            Separador decimal de los precios
          </label>
          <Select
            id="decimal-sep"
            value={plan.decimal}
            onChange={(e) =>
              onPlanChange({ ...plan, decimal: e.target.value as DecimalSeparator })
            }
            className="h-9 w-auto"
          >
            <option value="auto">Detectar automáticamente</option>
            <option value=",">Coma — 1.234,56</option>
            <option value=".">Punto — 1,234.56</option>
          </Select>
        </div>
      </fieldset>

      {/* ── Mapeo de columnas ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="t-h3">Columnas del archivo</h3>
        <ul className="border-y border-border">
          {plan.columns.map((column, i) => {
            const label = labels[i];
            const badge = confidenceBadge(column.confidence);
            const examples = dataRows
              .slice(0, 3)
              .map((row) => cellText(row[column.index], 24))
              .filter((v) => v !== "");
            const selectId = `col-${column.index}`;
            const hintId = `col-${column.index}-hint`;
            return (
              <li
                key={column.index}
                className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-center ${i > 0 ? "rule-t" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor={selectId} className="block truncate text-sm font-medium">
                    {label}
                  </label>
                  <p id={hintId} className="t-label mt-1 text-muted-foreground">
                    {examples.length > 0 ? examples.join(" · ") : "sin datos de ejemplo"}
                  </p>
                  {column.reason && (
                    <p className="t-small mt-1 text-muted-foreground">{column.reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:w-64 sm:justify-end">
                  {column.field !== "ignore" && (
                    <Badge tone={badge.tone}>{badge.text}</Badge>
                  )}
                  <Select
                    id={selectId}
                    aria-describedby={hintId}
                    value={column.field}
                    onChange={(e) => setField(column.index, e.target.value as MappedField)}
                    className="h-9 sm:w-44"
                  >
                    {MAPPED_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {FIELD_LABELS[f]}
                      </option>
                    ))}
                  </Select>
                </div>
              </li>
            );
          })}
        </ul>
        {!hasName && (
          <p
            role="alert"
            className="rounded-[var(--radius-theme-sm)] bg-destructive/10 p-3 text-sm font-semibold text-destructive"
          >
            Elige qué columna tiene el nombre del producto: es el único campo obligatorio.
          </p>
        )}
      </div>

      {/* ── Vista previa ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="t-h3">Vista previa</h3>
        <p className="t-small text-muted-foreground">
          Primeras {preview.length} filas ya interpretadas, con el mapeo de arriba. El
          archivo tiene {analysis.dataRowCount} filas de datos.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="t-label py-2 pr-3 font-normal text-muted-foreground">
                  Fila
                </th>
                <th scope="col" className="t-label py-2 pr-3 font-normal text-muted-foreground">
                  Nombre
                </th>
                <th scope="col" className="t-label py-2 pr-3 font-normal text-muted-foreground">
                  SKU
                </th>
                <th scope="col" className="t-label py-2 pr-3 text-right font-normal text-muted-foreground">
                  Precio
                </th>
                <th scope="col" className="t-label py-2 pr-3 text-right font-normal text-muted-foreground">
                  Stock
                </th>
                <th scope="col" className="t-label py-2 font-normal text-muted-foreground">
                  Categoría
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.line} className="border-b border-border align-top">
                  <td className="t-label py-2 pr-3 text-muted-foreground">{row.line}</td>
                  {row.product ? (
                    <>
                      <td className="max-w-48 truncate py-2 pr-3">{row.product.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {row.product.sku || "—"}
                      </td>
                      <td className="t-price py-2 pr-3 text-right">
                        {formatMoney(
                          Math.round(row.product.price * 100),
                          row.product.currency,
                        )}
                      </td>
                      <td className="t-price py-2 pr-3 text-right">{row.product.stock}</td>
                      <td className="py-2 text-muted-foreground">
                        {row.product.category || "—"}
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} className="py-2 font-medium text-destructive">
                      Se omitirá — {row.error}
                    </td>
                  )}
                </tr>
              ))}
              {preview.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-muted-foreground">
                    No hay filas de datos que mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transparencia: qué se envió a Google ─────────────────────────── */}
      {analysis.sentToGoogle && (
        <details className="rounded-[var(--radius-theme-sm)] border border-border">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
            Ver qué se envió a Google para el análisis
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-border px-3 py-2 text-xs leading-relaxed">
            {analysis.sentToGoogle}
          </pre>
        </details>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-theme-sm)] bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={importing}>
          Elegir otro archivo
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={importing || !hasName}
          className="gap-2"
        >
          {importing && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {importing ? "Importando…" : "Importar productos"}
        </Button>
      </div>
    </div>
  );
}
