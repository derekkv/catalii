"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, LayoutDashboard, ShoppingCart, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navegación del panel de administración.
 *
 * Componente de cliente **sin datos**: solo necesita saber la ruta activa, así
 * que no recibe nada consultado con el cliente de servicio. Pestañas
 * subrayadas en vez de píldoras, como el resto de la app, y desplazamiento
 * horizontal en móvil en lugar de un menú plegable.
 */
const LINKS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/negocios", label: "Negocios", icon: Store },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/metricas", label: "Métricas", icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav aria-label="Secciones de administración" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "t-label flex min-h-11 items-center gap-2 border-b-2 px-3 transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
