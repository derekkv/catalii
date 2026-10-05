import { cn } from "@/lib/utils";

/**
 * Cabecera de página del panel.
 *
 * Existe para que las seis secciones no repitan cada una su propia
 * combinación de tamaños: ceja en versalitas, título en serif y regla de
 * cierre. Una sola fuente de verdad para el arranque de página.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("rule-b pb-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow && <p className="t-eyebrow">{eyebrow}</p>}
          <h1 className={cn("t-h1", eyebrow && "mt-3")}>{title}</h1>
          {description && (
            <p className="t-body mt-2 max-w-xl text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
