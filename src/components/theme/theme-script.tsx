import { DEFAULT_THEME } from "@/lib/themes";

/**
 * Script inline que aplica el theme guardado ANTES de la hidratación,
 * evitando el "flash" de theme incorrecto (FOUC). Solo corre en el navegador.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('catalii-theme');var valid=['vibrant','coral','ocean','midnight','luxe','swiss'];if(!t||valid.indexOf(t)===-1){t='${DEFAULT_THEME}';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
