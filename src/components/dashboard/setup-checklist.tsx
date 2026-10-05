import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupStep {
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

/**
 * Primeros pasos.
 *
 * Un mayorista recién registrado no sabe que el camino es
 * productos → catálogo → publicar → compartir. Sin esta guía llega al panel,
 * ve cuatro ceros y se va.
 *
 * Maquetado como un sumario numerado: ordinal monoespaciado, regla por paso y
 * acción sólo en el paso siguiente, para que haya una única cosa que hacer.
 * Desaparece al completarse los cuatro.
 */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const next = steps.find((s) => !s.done);

  return (
    <section
      aria-labelledby="setup-title"
      className="border border-border bg-card"
      data-print="hide"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 rule-b px-5 py-4">
        <h2 id="setup-title" className="t-h3">
          Pon tu catálogo en marcha
        </h2>
        <p className="t-label text-muted-foreground">
          {done} de {steps.length} listos
        </p>
      </div>

      <ol>
        {steps.map((step, i) => {
          const isNext = step === next;
          return (
            <li
              key={step.title}
              className={cn(
                "flex items-start gap-4 px-5 py-4",
                i > 0 && "rule-t",
                isNext && "bg-muted",
              )}
            >
              {/* Ordinal o marca de completado, siempre en la misma columna. */}
              <span
                className={cn(
                  "t-num mt-0.5 w-6 shrink-0 text-sm",
                  step.done ? "text-primary" : isNext ? "text-foreground" : "text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {step.done ? <Check className="size-4" /> : `0${i + 1}`}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done && "text-muted-foreground line-through decoration-1",
                  )}
                >
                  {step.title}
                  <span className="sr-only">{step.done ? " (completado)" : ""}</span>
                </p>
                {!step.done && (
                  <p className="t-small mt-1 text-muted-foreground">{step.description}</p>
                )}
              </div>

              {isNext && (
                <Link
                  href={step.href}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-theme-sm)] bg-primary px-3 text-[0.8125rem] font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
                >
                  {step.cta}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
