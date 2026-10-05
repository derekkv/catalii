"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-theme-sm)] px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Salir</span>
        <span className="sr-only sm:hidden">Cerrar sesión</span>
      </button>
    </form>
  );
}
