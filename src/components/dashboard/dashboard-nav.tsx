"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, BookOpen, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/catalogos", label: "Catálogos", icon: BookOpen },
  { href: "/dashboard/facturacion", label: "Plan", icon: CreditCard },
  { href: "/dashboard/configuracion", label: "Ajustes", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav aria-label="Navegación principal" className="flex gap-1 md:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-theme-sm)] px-3 py-2 text-xs font-medium transition-colors md:flex-none md:flex-row md:gap-3 md:text-sm",
              active
                ? "bg-primary text-on-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
