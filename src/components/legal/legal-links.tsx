import Link from "next/link";
import { LEGAL_PATHS } from "@/lib/legal/config";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: LEGAL_PATHS.privacy, label: "Privacidad" },
  { href: LEGAL_PATHS.terms, label: "Términos" },
  { href: LEGAL_PATHS.refunds, label: "Reembolsos" },
  { href: LEGAL_PATHS.copyright, label: "Derechos de autor" },
  { href: LEGAL_PATHS.providers, label: "Proveedores" },
  { href: LEGAL_PATHS.contact, label: "Contacto" },
] as const;

/** Enlaces a las páginas legales, para pies de página. */
export function LegalLinks({
  className,
  only,
}: {
  className?: string;
  /** Muestra solo algunas (p. ej. catálogo público: privacidad y términos). */
  only?: readonly (typeof LINKS)[number]["href"][];
}) {
  const items = only ? LINKS.filter((l) => only.includes(l.href)) : LINKS;
  return (
    <nav aria-label="Información legal" className={className}>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {items.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={cn(
                "t-label inline-flex min-h-8 items-center text-muted-foreground transition-colors hover:text-foreground",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              )}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
