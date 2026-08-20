"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME, resolveTheme } from "@/lib/themes";

const STORAGE_KEY = "catalogo-theme";

interface ThemeContextValue {
  theme: string;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

/**
 * Provider a nivel de app (dashboard/marketing). Sincroniza el theme con
 * localStorage y el atributo data-theme del <html>. El ThemeScript ya aplicó
 * el valor inicial, así que aquí solo lo leemos y reaccionamos a cambios.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    // Sincroniza con el valor persistido tras la hidratación (evita mismatch SSR).
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(resolveTheme(stored));
  }, []);

  const setTheme = useCallback((id: string) => {
    const resolved = resolveTheme(id);
    setThemeState(resolved);
    try {
      localStorage.setItem(STORAGE_KEY, resolved);
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
