import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { adminConfigured, requireAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/dashboard/signout-button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AdminNav } from "./_components/admin-nav";

/**
 * Panel de administración del SaaS.
 *
 * ── Quién entra ────────────────────────────────────────────────────────────
 * Tres capas, en este orden:
 *   1. `src/lib/supabase/middleware.ts` exige sesión para /admin (redirige a
 *      /login sin tocar la base).
 *   2. Este layout llama a `requireAdmin()`.
 *   3. CADA página vuelve a llamar a `requireAdmin()` como primera
 *      instrucción. No se delega en el layout: en el App Router, layout y
 *      página son árboles independientes y un fallo o un cambio en el layout
 *      no debe poder dejar una página abierta.
 *
 * `requireAdmin()` responde 404 (no 403) a quien tiene sesión pero no está en
 * `ADMIN_EMAILS`, así que el panel no se delata.
 *
 * ── Qué puede hacer ───────────────────────────────────────────────────────
 * Solo leer. No hay ninguna acción de servidor en /admin: ni borrar negocios,
 * ni cambiar planes, ni tocar suscripciones. Los datos se consultan con el
 * cliente de servicio (salta RLS) exclusivamente en el servidor, y a los
 * componentes de cliente (`AdminNav`, `ThemeSwitcher`, `SignOutButton`) no les
 * llega ningún dato de negocio.
 */

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  // El panel no se indexa nunca. `sitemap.ts` no lo lista, y aunque
  // `robots.ts` no incluye /admin en su `disallow`, estas cabeceras y el 404
  // para no administradores lo mantienen fuera de los buscadores.
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /*
   * Si `ADMIN_EMAILS` está vacío, `requireAdmin()` devuelve 404 a todo el
   * mundo —incluido el dueño— y la pantalla no puede explicar por qué sin
   * confirmar a cualquier visitante que /admin existe. El aviso va al log del
   * servidor, que es donde lo va a buscar quien despliega, y queda
   * documentado en `.env.example`.
   */
  if (!adminConfigured()) {
    console.error(
      "[admin] ADMIN_EMAILS está vacío: /admin responde 404 para todos los usuarios, " +
        "incluido el dueño. Define ADMIN_EMAILS=correo@dominio.com (separa varios con comas) " +
        "en el entorno del servidor y vuelve a desplegar.",
    );
  }

  const user = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-8">
          <Link href="/admin" aria-label="Administración de Catalii">
            <BrandLogo size="sm" />
          </Link>

          <span
            className="t-label flex items-center gap-1.5 border-l border-border pl-3 text-primary"
            title="Panel interno: solo lectura"
          >
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
            Administración
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="t-small hidden text-muted-foreground sm:inline" title="Sesión actual">
              {user.email}
            </span>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center gap-2 px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden md:inline">Mi panel</span>
            </Link>
            <ThemeSwitcher />
            <SignOutButton />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <AdminNav />
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
