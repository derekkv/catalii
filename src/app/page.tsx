import Link from "next/link";
import {
  Zap,
  Smartphone,
  ShoppingBag,
  Palette,
  MessageCircle,
  BarChart3,
  Check,
  ArrowRight,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";

const features = [
  { icon: Zap, title: "Listo en 10 minutos", desc: "Sube tu Excel o CSV y tu catálogo queda publicado al instante." },
  { icon: Smartphone, title: "Mobile-first", desc: "Optimizado para el celular, donde compran tus clientes." },
  { icon: ShoppingBag, title: "Pedidos sin fricción", desc: "Tus clientes arman su pedido sin necesidad de crear cuenta." },
  { icon: Palette, title: "Themes configurables", desc: "Elige entre varios diseños y colores para tu marca." },
  { icon: MessageCircle, title: "WhatsApp nativo", desc: "Comparte por link o QR y recibe pedidos al instante." },
  { icon: BarChart3, title: "Todo en un panel", desc: "Productos, stock y pedidos organizados en un solo lugar." },
];

const steps = [
  { n: "1", title: "Sube tus productos", desc: "Importa tu lista desde Excel/CSV o cárgalos a mano." },
  { n: "2", title: "Personaliza y publica", desc: "Elige el theme, arma tu catálogo y publícalo." },
  { n: "3", title: "Comparte y vende", desc: "Envía el link por WhatsApp y recibe pedidos." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <span className="font-heading text-xl font-bold text-brand-gradient">{siteConfig.name}</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-[var(--radius-theme-sm)] bg-primary px-4 text-sm font-semibold text-on-primary hover:opacity-90"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="accent" className="mb-4">Para mayoristas PYME de LATAM</Badge>
            <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
              Tu lista de precios,{" "}
              <span className="text-brand-gradient">un catálogo online</span> con pedidos
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-7 text-base font-semibold text-on-primary shadow-soft hover:opacity-90 sm:w-auto"
              >
                Crear mi catálogo gratis <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <a
                href="#planes"
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-theme-sm)] border border-border px-7 text-base font-semibold hover:bg-muted sm:w-auto"
              >
                Ver precios
              </a>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Sin tarjeta. Plan gratis para siempre.</p>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/50 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-heading text-3xl font-bold">Todo lo que necesitas para vender</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="transition-shadow hover:shadow-soft">
                  <CardContent className="p-6">
                    <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-gradient text-on-primary">
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

        {/* How it works */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-3xl font-bold">Así de fácil</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-gradient font-heading text-2xl font-bold text-on-primary">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planes" className="bg-muted/50 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-heading text-3xl font-bold">Precios simples</h2>
            <p className="mt-2 text-center text-muted-foreground">Empieza gratis. Crece cuando lo necesites.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/login"
                        className="inline-flex h-11 items-center justify-center rounded-[var(--radius-theme-sm)] bg-primary text-sm font-semibold text-on-primary hover:opacity-90"
                      >
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
        <section className="px-4 py-20">
          <div className="mx-auto max-w-3xl rounded-[var(--radius-theme-lg)] bg-brand-gradient p-10 text-center text-on-primary shadow-soft">
            <h2 className="font-heading text-3xl font-bold">Empieza hoy, es gratis</h2>
            <p className="mx-auto mt-3 max-w-md opacity-90">
              Crea tu primer catálogo en minutos y comparte tu link por WhatsApp.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-theme-sm)] bg-card px-7 text-base font-semibold text-card-foreground hover:opacity-90"
            >
              Crear mi catálogo <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}.
      </footer>
    </div>
  );
}
