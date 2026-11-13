/**
 * Exporta los textos legales a Markdown en docs/legal/textos/.
 *
 * La fuente única es src/lib/legal/content.ts (y los datos, config.ts): este
 * script solo los vuelca, para que las páginas web y los archivos que lee una
 * persona no puedan divergir. Vuelve a ejecutarlo tras cambiar un texto o
 * rellenar un dato, desde la raíz del repo:
 *
 *   pnpm legal:export
 *
 * Usa el `tsx` instalado en backend/ porque el front no tiene runner de TS.
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACADEMIC_NOTICE,
  LEGAL_DOCS,
  formatVersion,
  pendingMarkers,
  type LegalDoc,
} from "../src/lib/legal/content";
import { missingLegalData } from "../src/lib/legal/config";

const root = process.cwd();
if (!existsSync(join(root, "src/lib/legal/content.ts"))) {
  console.error("Ejecuta este script desde la raíz del repositorio.");
  process.exit(1);
}

const outDir = join(root, "docs", "legal", "textos");

function toMarkdown(doc: LegalDoc): string {
  const out: string[] = [
    `# ${doc.title}`,
    "",
    `Versión: ${formatVersion(doc.version)} · Página: \`${doc.path}\``,
    "",
    doc.description,
    "",
    "> Generado desde `src/lib/legal/content.ts` con `pnpm legal:export`. No lo edites a mano.",
    "",
    // El aviso de proyecto escolar va arriba también aquí, igual que en la web.
    ...ACADEMIC_NOTICE.map((line) => `> **${line}**`),
    "",
  ];

  const { data } = pendingMarkers(doc);
  if (data > 0) {
    out.push(`> Pendiente: ${data} dato(s) \`[COMPLETAR]\`.`, "");
  }

  for (const section of doc.sections) {
    out.push(`## ${section.title}`, "");
    for (const block of section.blocks) {
      if (block.type === "p") {
        out.push(block.text, "");
      } else {
        out.push(...block.items.map((i) => `- ${i}`), "");
      }
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

mkdirSync(outDir, { recursive: true });

const docs = Object.values(LEGAL_DOCS);
for (const doc of docs) {
  writeFileSync(join(outDir, `${doc.file}.md`), toMarkdown(doc), "utf8");
  const { data } = pendingMarkers(doc);
  console.log(`✓ ${doc.file}.md  (COMPLETAR: ${data})`);
}

// Al reducir el número de documentos quedan .md huérfanos de una exportación
// anterior: se borran para que docs/legal/textos/ no contradiga a la web.
const expected = new Set(docs.map((d) => `${d.file}.md`));
for (const file of readdirSync(outDir)) {
  if (file.endsWith(".md") && !expected.has(file)) {
    unlinkSync(join(outDir, file));
    console.log(`– ${file} (eliminado: ya no existe ese documento)`);
  }
}

const missing = missingLegalData();
console.log(
  missing.length === 0
    ? "\nTodos los datos de config.ts están rellenos: las páginas pasan a ser indexables."
    : `\n${missing.length} campo(s) sin rellenar en src/lib/legal/config.ts:\n  ${missing.join("\n  ")}`,
);
