import Link from "next/link";
import {
  Rocket,
  Smartphone,
  ShoppingBag,
  Palette,
  MessageCircle,
  BarChart3,
  Check,
  ArrowRight,
  QrCode,
  Upload,
  Bell,
  Plus,
  Search,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";

const features = [
  { icon: Rocket, title: "Listo en 10 minutos", desc: "Sube tu Excel o CSV y tu catálogo queda publicado al instante." },
  { icon: Smartphone, title: "Hecho para el celular", desc: "Optimizado para móvil, donde compran tus clientes." },
  { icon: ShoppingBag, title: "Pedidos sin fricción", desc: "Tus clientes arman su pedido sin crear ninguna cuenta." },
  { icon: Palette, title: "Themes a tu marca", desc: "Elige entre 6 diseños y colores que combinen contigo." },
  { icon: MessageCircle, title: "WhatsApp nativo", desc: "Comparte por link o QR y recibe pedidos al instante." },
  { icon: BarChart3, title: "Todo en un panel", desc: "Productos, stock y pedidos ordenados en un solo lugar." },
];

const steps = [
  { icon: Upload, n: "1", title: "Sube tus productos", desc: "Importa tu lista desde Excel/CSV o cárgalos a mano." },
  { icon: Palette, n: "2", title: "Personaliza y publica", desc: "Elige tu theme, arma el catálogo y publícalo." },
  { icon: QrCode, n: "3", title: "Comparte y vende", desc: "Envía el link o QR por WhatsApp y recibe pedidos." },
];

const stats = [
  { n: "10 min", l: "para publicar" },
  { n: "6", l: "themes" },
  { n: "0", l: "apps que instalar" },
  { n: "24/7", l: "recibiendo pedidos" },
];

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-6 font-semibold text-on-primary shadow-soft transition-opacity hover:opacity-90";
const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] border border-border bg-card px-6 font-semibold text-card-foreground transition-colors hover:bg-muted";

/** Vista previa del producto usando el mismo estilo de tarjetas del panel. */
function ProductPreview() {
  const tiles = ["#F59E0B", "#8B5CF6", "#0EA5E9", "#10B981"];
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-on-primary">C</span>
            <span className="text-sm font-bold">Distribuidora El Sol</span>
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-[var(--radius-theme-sm)] bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" aria-hidden="true" /> Buscar producto…
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((c, i) => (
              <div key={i} className="rounded-[var(--radius-theme-sm)] border border-border p-2">
                <div className="mb-2 aspect-square rounded-[var(--radius-theme-sm)]" style={{ background: c }} />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">${(i + 1) * 45}</span>
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Plus className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="absolute -left-5 top-24 w-52 shadow-soft md:-left-10">
        <CardContent className="flex items-center gap-2 p-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-on-accent">
            <Bell className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold">¡Nuevo pedido!</p>
            <p className="truncate text-xs text-muted-foreground">Tienda López · $1,240</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      {/* Nav — mismo lenguaje que el header del panel */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="font-heading text-2xl font-bold text-brand-gradient">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link href="/login" className="hidden h-10 items-center rounded-[var(--radius-theme-sm)] px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex">
              Entrar
            </Link>
            <Link href="/login?tab=signup" className={`${primaryBtn} h-10 text-sm`}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        {/* Hero */}
        <section className="px-4 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-up text-center md:text-left">
              <Badge tone="muted" className="mb-4">Para mayoristas de LATAM</Badge>
              <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
                Tu lista de precios, <span className="text-brand-gradient">un catálogo online</span> con pedidos
              </h1>
              <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground md:mx-0">
                {siteConfig.description}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                <Link href="/login?tab=signup" className={`${primaryBtn} h-14 w-full py-3.5 text-base sm:w-auto`}>
                  Crear mi catálogo gratis <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
                <a href="#como" className={`${outlineBtn} h-14 w-full py-3.5 text-base sm:w-auto`}>
                  Ver cómo funciona
                </a>
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">Sin tarjeta · Plan gratis para siempre</p>
            </div>
            <div className="animate-fade-up">
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-heading text-3xl font-bold text-primary md:text-4xl">{s.n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <Badge tone="primary" className="mb-3">Todo lo que necesitas</Badge>
              <h2 className="font-heading text-3xl font-bold md:text-4xl">Vender al por mayor, sin fricción</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="transition-shadow hover:shadow-soft">
                  <CardContent className="p-6">
                    <span className="mb-4 flex size-12 items-center justify-center rounded-[var(--radius-theme-sm)] bg-muted text-primary">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="font-heading text-lg font-bold">{title}</h3>
                    <p className="mt-1 text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como" className="bg-card px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <Badge tone="primary" className="mb-3">En 3 pasos</Badge>
              <h2 className="font-heading text-3xl font-bold md:text-4xl">Así de fácil</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map(({ icon: Icon, n, title, desc }) => (
                <div key={n} className="rounded-[var(--radius-theme)] border border-border bg-background p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading font-bold text-on-primary">{n}</span>
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planes" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <Badge tone="primary" className="mb-3">Precios simples</Badge>
              <h2 className="font-heading text-3xl font-bold md:text-4xl">Empieza gratis, crece sin límites</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {PLAN_ORDER.map((tier) => {
                const plan = PLANS[tier];
                return (
                  <Card key={tier} className={plan.highlighted ? "border-primary ring-2 ring-primary/30" : undefined}>
                    <CardContent className="flex h-full flex-col gap-4 p-6">
                      <div>
                        {plan.highlighted && <Badge tone="primary" className="mb-2">Popular</Badge>}
                        <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                        <p className="mt-1">
                          <span className="font-heading text-3xl font-bold">{plan.priceLabel}</span>
                          {tier !== "free" && <span className="text-muted-foreground"> /mes</span>}
                        </p>
                      </div>
                      <ul className="flex-1 space-y-2 text-sm">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/login?tab=signup" className={`${primaryBtn} h-11 text-sm`}>
                        Empezar
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 pb-24 pt-4">
          <div className="mx-auto max-w-4xl rounded-[var(--radius-theme-lg)] bg-brand-gradient p-10 text-center text-on-primary shadow-soft md:p-14">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">Empieza hoy, es gratis</h2>
            <p className="mx-auto mt-3 max-w-md opacity-90">
              Crea tu catálogo en minutos y compártelo por WhatsApp.
            </p>
            <Link
              href="/login?tab=signup"
              className="mt-7 inline-flex h-14 items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] bg-card px-8 py-3.5 text-base font-bold text-card-foreground transition-transform hover:-translate-y-0.5"
            >
              Crear mi catálogo <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name} · {siteConfig.domain} — {siteConfig.tagline}.
      </footer>
    </div>
  );
}
