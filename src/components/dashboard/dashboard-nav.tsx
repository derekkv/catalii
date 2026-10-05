"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BookOpen,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, primary: true },
  { href: "/dashboard/productos", label: "Productos", icon: Package, primary: true },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart, primary: true },
  { href: "/dashboard/catalogos", label: "Catálogos", icon: BookOpen, primary: true },
  { href: "/dashboard/facturacion", label: "Plan", icon: CreditCard, primary: false },
  { href: "/dashboard/configuracion", label: "Ajustes", icon: Settings, primary: true },
];

/**
 * Navegación del panel.
 *
 * `variant="bottom"` sólo muestra los destinos primarios: seis pestañas en una
 * barra inferior de móvil dejan ~60 px por objetivo, por debajo del mínimo
 * táctil recomendado y con etiquetas que se cortan. "Plan" vive en la cabecera
 * (insignia del plan) y en la barra lateral de escritorio.
 */
export function DashboardNav({ variant = "sidebar" }: { variant?: "sidebar" | "bottom" }) {
  const pathname = usePathname();
  const links = variant === "bottom" ? LINKS.filter((l) => l.primary) : LINKS;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label={variant === "bottom" ? "Navegación principal" : "Secciones del panel"}
      className={cn("flex gap-1", variant === "sidebar" && "md:flex-col")}
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-theme-sm)] px-2 py-2 text-[11px] font-medium transition-colors",
              // Mínimo táctil de 44 px también en móvil.
              "min-h-11",
              variant === "sidebar" && "md:flex-none md:flex-row md:gap-3 md:px-3 md:text-sm",
              active
                ? "bg-primary text-on-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
