import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { LegalLinks } from "@/components/legal/legal-links";
import {
  ACADEMIC_NOTICE,
  formatVersion,
  pendingMarkers,
  type LegalDoc,
} from "@/lib/legal/content";
import { siteConfig } from "@/lib/site";

/**
 * Plantilla de página legal. Server component estático.
 *
 * Arriba va siempre el aviso de proyecto académico: es el contexto que hace
 * honesto al resto del texto, así que no se puede cerrar ni omitir.
 *
 * Si al documento le faltan datos, se avisa debajo y la página no se indexa
 * (ver el `robots` de cada page.tsx). El aviso desaparece solo en cuanto se
 * rellena `COMPANY` en src/lib/legal/config.ts: así nunca se publica como
 * definitivo un texto con huecos.
 */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const pending = pendingMarkers(doc);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link href="/" aria-label={`${siteConfig.name}: inicio`}>
            <Wordmark />
          </Link>
          <Link href="/" className="t-label text-muted-foreground hover:text-foreground">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        <article className="mx-auto max-w-3xl px-5 py-10 lg:px-8 lg:py-14">
          <div
            role="note"
            aria-labelledby="aviso-academico"
            className="mb-8 border-l-2 border-primary bg-muted px-4 py-3"
          >
            <p id="aviso-academico" className="t-label text-foreground">
              Proyecto escolar
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {ACADEMIC_NOTICE.map((line) => (
                <li key={line} className="t-small text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {pending.data > 0 && (
            <div
              role="note"
              aria-label="Apartados pendientes"
              className="mb-8 border-l-2 border-accent bg-muted px-4 py-3"
            >
              <p className="t-label text-foreground">Documento incompleto</p>
              <p className="t-small mt-1 text-muted-foreground">
                Quedan datos sin rellenar, marcados en el texto. Este documento no es
                asesoría legal.
              </p>
            </div>
          )}

          <header className="rule-b pb-5">
            <p className="t-eyebrow">Legal</p>
            <h1 className="t-h1 mt-3">{doc.title}</h1>
            <p className="t-body mt-2 text-muted-foreground">{doc.description}</p>
            <p className="t-label mt-3 text-muted-foreground">
              Versión: {formatVersion(doc.version)}
            </p>
          </header>

          {doc.sections.length > 3 && (
            <nav aria-label="Índice" className="mt-6">
              <p className="t-label text-muted-foreground">Contenido</p>
              <ol className="mt-2 space-y-1">
                {doc.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="link-ink text-sm">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-8 space-y-8">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-20">
                <h2 id={`${s.id}-t`} className="t-h3">
                  {s.title}
                </h2>
                <div className="mt-2 space-y-3">
                  {s.blocks.map((b, i) =>
                    b.type === "p" ? (
                      <p key={i} className="t-body text-muted-foreground">
                        {b.text}
                      </p>
                    ) : (
                      <ul key={i} className="list-disc space-y-1.5 pl-5">
                        {b.items.map((item, j) => (
                          <li key={j} className="t-body text-muted-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-6 lg:px-8">
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
