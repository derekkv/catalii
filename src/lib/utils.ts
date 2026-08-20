import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un monto (en centavos) a moneda legible. */
export function formatMoney(
  amountCents: number,
  currency = "USD",
  locale = "es-MX",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

/** Genera un slug URL-safe a partir de un texto arbitrario. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** Escapa texto para uso seguro dentro de atributos/JSON en el cliente. */
export function safeText(input: unknown, max = 500): string {
  if (typeof input !== "string") return "";
  return input.slice(0, max);
}
