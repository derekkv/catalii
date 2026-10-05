import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
 * Un mayorista que se registra no sabe que el camino es
 * productos → catálogo → publicar → compartir. Sin esta guía, llega al panel,
 * ve cuatro ceros y se va. Desaparece sola al completar los cuatro pasos.
 */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const next = steps.find((s) => !s.done);
  const pct = Math.round((done / steps.length) * 100);

  return (
    <Card className="border-primary/40">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold">Pon tu catálogo en marcha</h2>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {done} de {steps.length}
          </span>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de configuración"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ol className="mt-4 space-y-1">
          {steps.map((step) => {
            const isNext = step === next;
            return (
              <li key={step.title}>
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-[var(--radius-theme-sm)] p-3",
                    isNext && "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      step.done
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {step.done ? <Check className="size-3.5" /> : steps.indexOf(step) + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        step.done && "text-muted-foreground line-through",
                      )}
                    >
                      {step.title}
                      <span className="sr-only">{step.done ? " (completado)" : ""}</span>
                    </p>
                    {!step.done && (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    )}
                  </div>

                  {isNext && (
                    <Link
                      href={step.href}
                      className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[var(--radius-theme-sm)] bg-primary px-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                    >
                      {step.cta}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
