/**
 * Registro central de THEMES seleccionables.
 *
 * Cada theme se aplica vía el atributo `data-theme` en un contenedor (o en <html>).
 * Los valores de color viven en `globals.css` bajo `[data-theme="<id>"]`.
 * Aquí sólo describimos metadatos para poder listarlos en la UI (selector de
 * theme del panel y personalización del catálogo público).
 *
 * Basado en el sistema de diseño de ui-ux-pro-max: paletas verificadas con
 * contraste accesible (>= 4.5:1 en texto normal).
 */

export type ThemeMode = "light" | "dark";

export interface ThemeMeta {
  /** Identificador estable usado en `data-theme` y guardado en la BD. */
  id: string;
  /** Nombre visible para el usuario. */
  name: string;
  /** Descripción corta del carácter del theme. */
  description: string;
  /** Modo base (light/dark) para elegir icono/preview por defecto. */
  mode: ThemeMode;
  /** Colores representativos para el swatch del selector (solo preview). */
  swatch: {
    primary: string;
    accent: string;
    background: string;
    card: string;
  };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "vibrant",
    name: "Vibrante",
    description: "Enérgico y divertido. Verde + naranja. Ideal para retail dinámico.",
    mode: "light",
    swatch: { primary: "#059669", accent: "#EA580C", background: "#ECFDF5", card: "#FFFFFF" },
  },
  {
    id: "coral",
    name: "Coral",
    description: "Cálido y social. Rosa vibrante para marcas jóvenes y cercanas.",
    mode: "light",
    swatch: { primary: "#E11D48", accent: "#8B5CF6", background: "#FFF1F2", card: "#FFFFFF" },
  },
  {
    id: "ocean",
    name: "Océano",
    description: "Fresco y confiable. Azul profesional para insumos y B2B serio.",
    mode: "light",
    swatch: { primary: "#0284C7", accent: "#F59E0B", background: "#F0F9FF", card: "#FFFFFF" },
  },
  {
    id: "midnight",
    name: "Medianoche",
    description: "Oscuro y premium. Navy + dorado. Look tech/fintech elegante.",
    mode: "dark",
    swatch: { primary: "#F59E0B", accent: "#8B5CF6", background: "#0F172A", card: "#1E2537" },
  },
  {
    id: "luxe",
    name: "Luxe",
    description: "Sobrio y de lujo. Grafito + dorado para productos premium.",
    mode: "light",
    swatch: { primary: "#1C1917", accent: "#A16207", background: "#FAFAF9", card: "#FFFFFF" },
  },
  {
    id: "swiss",
    name: "Swiss",
    description: "Minimal y neutro. Alto contraste, sin distracciones.",
    mode: "light",
    swatch: { primary: "#111827", accent: "#2563EB", background: "#FFFFFF", card: "#FFFFFF" },
  },
];

export const DEFAULT_THEME = "vibrant";

const THEME_IDS = new Set(THEMES.map((t) => t.id));

/** Valida un id de theme recibido desde BD/entrada; cae al default si es inválido. */
export function resolveTheme(id: string | null | undefined): string {
  return id && THEME_IDS.has(id) ? id : DEFAULT_THEME;
}

export function getThemeMeta(id: string | null | undefined): ThemeMeta {
  const resolved = resolveTheme(id);
  return THEMES.find((t) => t.id === resolved) ?? THEMES[0];
}
