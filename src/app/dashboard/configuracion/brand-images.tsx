"use client";

import { BrandImageUpload } from "@/components/media/brand-image-upload";
import { resolveBrandImage } from "@/lib/media/config";
import { setBusinessImage } from "./actions";
import type { Business } from "@/types/database";

export function BusinessBrandImages({ business }: { business: Business }) {
  return (
    <div className="space-y-5">
      <BrandImageUpload
        kind="logo"
        label="Foto de perfil / logo"
        hint="Cuadrado. Se usa en tus catálogos que no tengan logo propio."
        currentUrl={resolveBrandImage(business.logo_key, business.logo_url, "thumb")}
        fallbackLetter={business.name}
        onCommit={(key) => setBusinessImage("logo", key)}
      />
      <BrandImageUpload
        kind="banner"
        label="Banner por defecto"
        hint="Formato 3:1 (p. ej. 1800×600). Lo heredan los catálogos sin banner propio."
        currentUrl={resolveBrandImage(business.banner_key, null, "thumb")}
        onCommit={(key) => setBusinessImage("banner", key)}
      />
    </div>
  );
}
