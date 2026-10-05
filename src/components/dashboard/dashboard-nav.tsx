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
 * El estado activo es un filete de tinta a la izquierda sobre fondo tenue, no
 * una píldora de color pleno. La píldora rellena compite con el contenido y
 * obliga a invertir el texto; el filete marca la posición igual de rápido y
 * deja la jerarquía al contenido.
 *
 * `variant="bottom"` sólo muestra los destinos primarios: seis pestañas en el
 * ancho de un teléfono dejan ~60 px por objetivo y las etiquetas se cortan.
 * "Plan" vive en la cabecera y en la barra lateral.
 */
export function DashboardNav({ variant = "sidebar" }: { variant?: "sidebar" | "bottom" }) {
  const pathname = usePathname();
  const links = variant === "bottom" ? LINKS.filter((l) => l.primary) : LINKS;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  if (variant === "bottom") {
    return (
      <nav aria-label="Navegación principal" className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-1.5 transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
              <span className="t-label text-[0.625rem]">{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Secciones del panel" className="flex flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 border-l-2 py-2.5 pl-3.5 pr-3 transition-colors",
              active
                ? "border-primary bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="t-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
