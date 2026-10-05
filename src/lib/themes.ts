/**
 * Registro central de THEMES.
 *
 * Cada theme se aplica con el atributo `data-theme` en un contenedor (o en
 * <html>). Los valores viven en `globals.css` bajo `[data-theme="<id>"]`.
 * Aquí sólo están los metadatos para poder listarlos en la UI.
 *
 * Criterio: cinco themes, uno por tipo de mayorista, en vez de un muestrario
 * de paletas. Cada uno cambia color, radio y temperatura del papel, así que
 * elegir theme es una decisión de negocio ("vendo abarrotes", "vendo
 * refacciones") y no de gusto cromático.
 */

export type ThemeMode = "light" | "dark";

export interface ThemeMeta {
  /** Identificador estable usado en `data-theme` y guardado en la BD. */
  id: string;
  /** Nombre visible para el usuario. */
  name: string;
  /** Para quién es este theme, en términos del negocio del mayorista. */
  description: string;
  mode: ThemeMode;
  /** Colores representativos para el swatch del selector (sólo preview). */
  swatch: {
    primary: string;
    accent: string;
    background: string;
    card: string;
  };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "press",
    name: "Imprenta",
    description: "Papel cálido y tinta vermellón. Abarrotes, bebidas, distribución general.",
    mode: "light",
    swatch: { primary: "#B43B1F", accent: "#1F1B16", background: "#FBF8F3", card: "#FFFFFF" },
  },
  {
    id: "noche",
    name: "Noche",
    description: "Espresso oscuro con vermellón encendido. Destaca las fotos de producto.",
    mode: "dark",
    swatch: { primary: "#E4572E", accent: "#E8B84B", background: "#17120E", card: "#201A14" },
  },
  {
    id: "mercado",
    name: "Mercado",
    description: "Verde botánico profundo. Frutas, verduras, orgánicos y agro.",
    mode: "light",
    swatch: { primary: "#1F5C38", accent: "#A85A16", background: "#F8F7F1", card: "#FFFFFF" },
  },
  {
    id: "acero",
    name: "Acero",
    description: "Azul industrial a escuadra. Ferretería, refacciones, insumos técnicos.",
    mode: "light",
    swatch: { primary: "#1B3A5C", accent: "#B2561B", background: "#F5F7F8", card: "#FFFFFF" },
  },
  {
    id: "hueso",
    name: "Hueso",
    description: "Tinta negra y oro apagado, sin curvas. Perfumería, joyería, textil premium.",
    mode: "light",
    swatch: { primary: "#19120D", accent: "#8A6A1F", background: "#FAF8F5", card: "#FFFFFF" },
  },
];

export const DEFAULT_THEME = "press";

const THEME_IDS = new Set(THEMES.map((t) => t.id));

/**
 * Themes de la versión anterior del sistema de diseño.
 *
 * Los negocios y catálogos existentes tienen estos ids guardados en la BD. Sin
 * el mapeo, todos caerían al theme por defecto y un mayorista vería cambiar su
 * catálogo sin tocar nada. Se traducen al equivalente más cercano.
 */
const LEGACY_THEMES: Record<string, string> = {
  vibrant: "mercado",
  coral: "press",
  ocean: "acero",
  midnight: "noche",
  luxe: "hueso",
  swiss: "acero",
  warm: "noche",
};

/** Valida un id recibido de la BD/entrada; traduce los antiguos y cae al default. */
export function resolveTheme(id: string | null | undefined): string {
  if (!id) return DEFAULT_THEME;
  if (THEME_IDS.has(id)) return id;
  return LEGACY_THEMES[id] ?? DEFAULT_THEME;
}

export function getThemeMeta(id: string | null | undefined): ThemeMeta {
  const resolved = resolveTheme(id);
  return THEMES.find((t) => t.id === resolved) ?? THEMES[0];
}
