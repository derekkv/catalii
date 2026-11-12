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
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LEGAL_DOCS, formatVersion, pendingMarkers, type LegalDoc } from "../src/lib/legal/content";
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
  ];

  const { data, legal } = pendingMarkers(doc);
  if (data + legal > 0) {
    out.push(
      `> Pendiente: ${data} dato(s) \`[COMPLETAR]\` y ${legal} decisión(es) \`[PREGUNTAR A ABOGADO]\`.`,
      "",
    );
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

for (const doc of Object.values(LEGAL_DOCS)) {
  writeFileSync(join(outDir, `${doc.file}.md`), toMarkdown(doc), "utf8");
  const { data, legal } = pendingMarkers(doc);
  console.log(`✓ ${doc.file}.md  (COMPLETAR: ${data}, ABOGADO: ${legal})`);
}

const missing = missingLegalData();
console.log(
  missing.length === 0
    ? "\nTodos los datos de config.ts están rellenos: las páginas pasan a ser indexables."
    : `\n${missing.length} campo(s) sin rellenar en src/lib/legal/config.ts:\n  ${missing.join("\n  ")}`,
);
