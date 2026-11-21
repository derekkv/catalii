/**
 * Esquema y opciones del formulario de contacto.
 *
 * Vive fuera de `actions.ts` porque un módulo con `"use server"` solo puede
 * exportar funciones asíncronas: las constantes que necesita el formulario de
 * cliente (los asuntos y sus rótulos) tienen que estar en otro archivo. Así
 * además el navegador y el servidor validan con el mismo esquema.
 */

import { z } from "zod";

/** Asuntos posibles. Coinciden con el CHECK de `contact_message.subject`. */
export const CONTACT_SUBJECTS = [
  "duda",
  "problema",
  "datos",
  "contenido",
  "otro",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const SUBJECT_LABELS: Record<ContactSubject, string> = {
  duda: "Una duda sobre Catalii",
  problema: "Un problema con mi cuenta",
  datos: "Mis datos personales",
  contenido: "Avisar sobre el contenido de un catálogo",
  otro: "Otra cosa",
};

/** Límites iguales a los de la migración, para que la base nunca rechace. */
export const LIMITS = {
  name: 80,
  email: 160,
  message: 2000,
} as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre.")
    .max(LIMITS.name, "El nombre es demasiado largo."),
  // `toLowerCase` como en login/actions.ts: el mismo correo escrito con
  // mayúsculas no debe esquivar el límite de envíos por hora.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ese correo no parece válido.")
    .max(LIMITS.email, "El correo es demasiado largo."),
  subject: z.enum(CONTACT_SUBJECTS, { errorMap: () => ({ message: "Elige un asunto." }) }),
  message: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco más (al menos 10 caracteres).")
    .max(LIMITS.message, "El mensaje es demasiado largo."),
});

export type ContactInput = z.infer<typeof contactSchema>;
