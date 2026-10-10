import Link from "next/link";
import { getBusiness } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/signout-button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Wordmark, Monogram } from "@/components/brand/wordmark";
import { getPlan } from "@/lib/plans";
import { resolveBrandImage } from "@/lib/media/config";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Una sola verificación de sesión: `getBusiness()` ya exige usuario, así que
  // llamar antes a `getUser()` duplicaba la llamada de red a Auth.
  const business = await getBusiness();

  // Sin negocio (onboarding): render limpio sin el shell del panel.
  if (!business) {
    return <>{children}</>;
  }

  const plan = getPlan(business.plan);
  const avatar = resolveBrandImage(business.logo_key, business.logo_url, "thumb");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* ══ Barra lateral (escritorio) ═══════════════════════════════════
          Fondo de papel, no una ficha blanca: la lateral es el soporte, el
          contenido es lo que va impreso encima.                          */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border md:flex">
        <div className="rule-b px-5 py-4">
          <Link href="/dashboard" aria-label="Catalii, ir al resumen">
            <Wordmark size="sm" />
          </Link>
        </div>

        <div className="py-3">
          <DashboardNav />
        </div>

        <div className="mt-auto rule-t p-4">
          <Link
            href="/dashboard/facturacion"
            className="block rounded-[var(--radius-theme-sm)] transition-colors hover:bg-muted"
          >
            <p className="t-label text-muted-foreground">Negocio</p>
            <div className="mt-1.5 flex items-center gap-2">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="size-7 shrink-0 rounded-[var(--radius-theme-sm)] object-cover"
                />
              ) : (
                <Monogram letter={business.name} className="size-7 shrink-0 text-sm" />
              )}
              <p className="min-w-0 truncate text-sm font-medium">{business.name}</p>
            </div>
            <p className="t-label mt-2 text-primary">Plan {plan.name}</p>
          </Link>
        </div>
      </aside>

      {/* ══ Área principal ══════════════════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/92 px-4 py-2.5 backdrop-blur-sm md:px-8">
          <Link href="/dashboard" className="md:hidden" aria-label="Catalii, ir al resumen">
            <Wordmark size="sm" />
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            {/* En móvil "Plan" sale de la barra inferior y se ancla aquí. */}
            <Link
              href="/dashboard/facturacion"
              className="t-label flex h-11 items-center px-2 text-primary md:hidden"
              aria-label={`Plan actual: ${plan.name}. Ver planes`}
            >
              {plan.name}
            </Link>
            <ThemeSwitcher />
            <SignOutButton />
          </div>
        </header>

        <main id="contenido" className="flex-1 px-4 py-7 md:px-8 md:py-10">
          {children}
        </main>

        {/* Navegación inferior (móvil) */}
        <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
          <DashboardNav variant="bottom" />
        </div>
      </div>
    </div>
  );
}
