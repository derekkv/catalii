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
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link href="/dashboard" className="mb-6 px-2 font-heading text-xl font-bold text-brand-gradient">
          CataloGO
        </Link>
        <DashboardNav />
        <div className="mt-auto space-y-3 pt-4">
          <div className="rounded-[var(--radius-theme-sm)] bg-muted p-3">
            <p className="truncate text-sm font-semibold">{business.name}</p>
            <Badge tone={business.plan === "free" ? "muted" : "primary"} className="mt-1">
              Plan {plan.name}
            </Badge>
          </div>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-8">
          <Link href="/dashboard" className="font-heading text-lg font-bold text-brand-gradient md:hidden">
            CataloGO
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

        {/* Navegación inferior (móvil) */}
        <div className="sticky bottom-0 z-30 border-t border-border bg-card px-2 py-1.5 md:hidden">
          <DashboardNav />
        </div>
      </div>
    </div>
  );
}
