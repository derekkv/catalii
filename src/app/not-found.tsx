import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-6xl font-bold text-brand-gradient">404</p>
      <h1 className="font-heading text-2xl font-bold">Página no encontrada</h1>
      <p className="text-muted-foreground">
        El catálogo o la página que buscas no existe o dejó de estar disponible.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-[var(--radius-theme-sm)] bg-primary px-5 text-sm font-semibold text-on-primary hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
