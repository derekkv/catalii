import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { hasPendingData, LEGAL_DOCS } from "@/lib/legal/content";

const doc = LEGAL_DOCS.privacy;

/**
 * Mientras el documento tenga datos sin rellenar no se indexa; en cuanto se
 * rellena `COMPANY` (src/lib/legal/config.ts) pasa a ser indexable sin tocar
 * este archivo.
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
