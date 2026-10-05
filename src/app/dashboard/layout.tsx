import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, getBusiness } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/signout-button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { getPlan } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const business = await getBusiness();

  // Sin negocio (onboarding): render limpio sin el shell del panel.
  if (!business) {
    return <>{children}</>;
  }

  const plan = getPlan(business.plan);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (escritorio) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link
          href="/dashboard"
          className="mb-6 px-2 font-heading text-xl font-bold text-brand-gradient"
        >
          Catalii
        </Link>
        <DashboardNav />
        <div className="mt-auto pt-4">
          <Link
            href="/dashboard/facturacion"
            className="block rounded-[var(--radius-theme-sm)] bg-muted p-3 transition-colors hover:bg-border/40"
          >
            <p className="truncate text-sm font-semibold">{business.name}</p>
            <Badge tone={business.plan === "free" ? "muted" : "primary"} className="mt-1">
              Plan {plan.name}
            </Badge>
          </Link>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-8">
          <Link
            href="/dashboard"
            className="font-heading text-lg font-bold text-brand-gradient md:hidden"
          >
            Catalii
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {/* En móvil "Plan" sale de la barra inferior y se ancla aquí,
                para no apretar seis pestañas en el ancho de un teléfono. */}
            <Link
              href="/dashboard/facturacion"
              className="md:hidden"
              aria-label={`Plan actual: ${plan.name}. Ver planes`}
            >
              <Badge tone={business.plan === "free" ? "muted" : "primary"}>{plan.name}</Badge>
            </Link>
            <ThemeSwitcher />
            <SignOutButton />
          </div>
        </header>

        <main id="contenido" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>

        {/* Navegación inferior (móvil) */}
        <div className="sticky bottom-0 z-30 border-t border-border bg-card px-2 py-1.5 md:hidden">
          <DashboardNav variant="bottom" />
        </div>
      </div>
    </div>
  );
}
