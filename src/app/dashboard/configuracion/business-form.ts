import type { z } from "zod";
import { businessSchema, businessProfileSchema } from "@/lib/validation";
import { resolveTheme } from "@/lib/themes";
import { slugify } from "@/lib/utils";

/**
 * Lectura y validación del formulario del negocio.
 *
 * Vive fuera de las acciones porque lo usan dos rutas: el registro
 * (`/dashboard/onboarding`, que crea la fila) y los ajustes
 * (`/dashboard/configuracion`, que la actualiza). Son el mismo conjunto de
 * datos pedido en dos momentos distintos, así que el parseo y los mensajes de
 * error deben ser los mismos.
 *
 * No es un archivo `"use server"`: un módulo de acciones sólo puede exportar
 * funciones asíncronas, y aquí hace falta exportar también tipos y tablas.
 */

/** Nombre legible de cada campo, para construir mensajes de error. */
export const BUSINESS_FIELD_LABELS: Record<string, string> = {
  name: "Nombre del negocio",
  slug: "Enlace",
  whatsapp: "WhatsApp",
  email: "Correo de contacto",
  theme: "Apariencia",
  tagline: "Frase corta",
  description: "Descripción",
  category: "Rubro",
  phone: "Teléfono",
  address: "Dirección",
  city: "Ciudad",
  country: "País",
  website: "Sitio web",
  instagram: "Instagram",
  facebook: "Facebook",
  hours: "Horario",
};

/** Mensaje de error por nombre de campo, para pintarlo junto al input. */
export type BusinessFieldErrors = Record<string, string>;

export interface BusinessFormValues {
  basic: z.infer<typeof businessSchema>;
  profile: z.infer<typeof businessProfileSchema>;
}

export type BusinessFormParse =
  | { ok: true; values: BusinessFormValues }
  | { ok: false; error: string; fields: BusinessFieldErrors };

/**
 * ¿El mensaje lo escribió zod por su cuenta?
 *
 * Los esquemas de `lib/validation.ts` traen mensajes propios en español para
 * casi todo, pero no para todo (un `.max(160)` o un `.email()` sin texto caen
 * en el catálogo por defecto de zod, que está en inglés). Se detectan por el
 * arranque de la frase para poder sustituirlos; cualquier otro mensaje es del
 * esquema y se respeta tal cual.
 */
const ZOD_DEFAULT_MESSAGE =
  /^(Invalid|Expected|Required|Unrecognized|String must contain|Number must be|Array must contain)/;

function describeIssue(key: string, issue: z.ZodIssue): string {
  // Las uniones (`.or(z.literal(""))`, usado para "campo opcional") fallan con
  // un `invalid_union` cuyo mensaje es "Invalid input": lo útil está en las
  // ramas. Se descarta la del literal vacío, que nunca es el problema real
  // (el usuario escribió algo), y se describe la otra.
  if (issue.code === "invalid_union") {
    const branches = issue.unionErrors
      .flatMap((e) => e.issues)
      .filter((i) => i.code !== "invalid_literal");
    const chosen = branches.find((i) => !ZOD_DEFAULT_MESSAGE.test(i.message)) ?? branches[0];
    if (chosen) return describeIssue(key, chosen);
  }

  if (issue.message && !ZOD_DEFAULT_MESSAGE.test(issue.message)) return issue.message;

  // Los mensajes se arman con el rótulo seguido de dos puntos y no con una
  // frase ("X es demasiado largo"): así no hay que concordar el género del
  // campo con el adjetivo, que daba cosas como "La frase corta es largo".
  const label = BUSINESS_FIELD_LABELS[key] ?? "Este dato";
  if (issue.code === "too_big" && typeof issue.maximum === "number") {
    return `${label}: máximo ${issue.maximum} caracteres.`;
  }
  if (issue.code === "too_small") return `${label}: no puede quedar vacío.`;
  if (issue.code === "invalid_string" && issue.validation === "email") {
    return "Escribe un correo válido, como nombre@dominio.com.";
  }
  if (issue.code === "invalid_enum_value") return `${label}: elige una de las opciones.`;
  return `${label}: revisa el valor.`;
}

/** Convierte un error de zod en un mensaje por campo (el primero de cada uno). */
export function businessFieldErrors(error: z.ZodError): BusinessFieldErrors {
  const fields: BusinessFieldErrors = {};
  for (const issue of error.issues) {
    const key = typeof issue.path[0] === "string" ? issue.path[0] : "name";
    if (fields[key]) continue;
    fields[key] = describeIssue(key, issue);
  }
  return fields;
}

/**
 * Valida el formulario completo (datos básicos + perfil público).
 *
 * `Object.fromEntries` y no `formData.get()`: los checkbox se envían como un
 * `<input type="hidden" value="false">` seguido del checkbox con
 * `value="true"`, porque un checkbox desmarcado no viaja en el FormData. Con
 * dos entradas del mismo nombre, `get()` devuelve la PRIMERA (el "false") y la
 * casilla marcada no tendría efecto; `fromEntries` se queda con la última, que
 * es el comportamiento que necesita ese patrón.
 */
export function parseBusinessForm(
  formData: FormData,
  fallback: { slug?: string | null; theme?: string | null; email?: string | null } = {},
): BusinessFormParse {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name : "";
  const typedSlug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  // Sin identificador escrito se deriva del nombre (registro) o se conserva el
  // que ya tenía el negocio (ajustes), para no romper enlaces ya compartidos.
  const slugSource = typedSlug || fallback.slug || name;

  const basic = businessSchema.safeParse({
    name,
    slug: slugify(slugSource),
    whatsapp: raw.whatsapp ?? "",
    // El correo sólo se hereda si el campo no venía en el formulario; si el
    // usuario lo borró a propósito, se guarda vacío.
    email: raw.email !== undefined ? raw.email : (fallback.email ?? ""),
    // `resolveTheme` y no el valor crudo: si el registro de themes cambia, un
    // id antiguo guardado en la BD no hace fallar la validación del enum.
    theme: resolveTheme(typeof raw.theme === "string" ? raw.theme : (fallback.theme ?? null)),
  });
  const profile = businessProfileSchema.safeParse(raw);

  if (!basic.success || !profile.success) {
    // Los básicos primero: son los obligatorios, y el resumen del formulario
    // muestra el primer mensaje de la lista.
    const fields: BusinessFieldErrors = {
      ...(basic.success ? {} : businessFieldErrors(basic.error)),
      ...(profile.success ? {} : businessFieldErrors(profile.error)),
    };

    // El enlace derivado del nombre merece otro trato: el usuario no escribió
    // nada en ese campo, así que "Solo minúsculas, números y guiones" no le
    // dice qué hacer. Y si el nombre ya viene con error, el del enlace es la
    // misma causa contada dos veces.
    if (!typedSlug && fields.slug) {
      if (fields.name) delete fields.slug;
      else fields.slug = "No pudimos armar un enlace con ese nombre. Escríbelo tú.";
    }

    const first = Object.values(fields)[0] ?? "Revisa los datos del formulario.";
    return { ok: false, error: first, fields };
  }

  return { ok: true, values: { basic: basic.data, profile: profile.data } };
}

/** Columnas de perfil listas para un `insert`/`update` ("" se guarda como NULL). */
export function businessProfileColumns(profile: z.infer<typeof businessProfileSchema>) {
  return {
    tagline: profile.tagline || null,
    description: profile.description || null,
    category: profile.category || null,
    phone: profile.phone || null,
    address: profile.address || null,
    city: profile.city || null,
    country: profile.country || null,
    website: profile.website || null,
    instagram: profile.instagram || null,
    facebook: profile.facebook || null,
    hours: profile.hours || null,
  };
}
