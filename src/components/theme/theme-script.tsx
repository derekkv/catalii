import { DEFAULT_THEME, THEMES } from "@/lib/themes";

/**
 * Script inline que aplica el theme guardado ANTES de la hidratación, para
 * evitar el destello de theme incorrecto (FOUC).
 *
 * La lista de ids se deriva del registro en lugar de estar escrita a mano:
 * antes era un array literal que había que recordar actualizar, y al cambiar
 * los themes habría invalidado en silencio la preferencia de todos.
 */
export function ThemeScript() {
  const ids = JSON.stringify(THEMES.map((t) => t.id));
  const code = `(function(){try{var v=${ids};var t=localStorage.getItem('catalii-theme');if(!t||v.indexOf(t)===-1){t='${DEFAULT_THEME}';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
