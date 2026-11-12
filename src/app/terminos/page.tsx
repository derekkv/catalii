import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { hasPendingData, LEGAL_DOCS } from "@/lib/legal/content";

const doc = LEGAL_DOCS.terms;

/**
 * Mientras el documento tenga apartados sin completar no se indexa; en cuanto
 * se rellenan `COMPANY` y `LEGAL_DATA` (src/lib/legal/config.ts) pasa a ser
 * indexable sin tocar este archivo.
 */
export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: doc.path },
  robots: { index: !hasPendingData(doc) },
};

export default function Page() {
  return <LegalPage doc={doc} />;
}
