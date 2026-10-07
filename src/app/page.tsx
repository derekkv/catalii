import Link from "next/link";
import { ArrowRight, Check, Minus, Plus, Zap, Link2, QrCode, Smartphone, Tag, Boxes } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Wordmark, Monogram } from "@/components/brand/wordmark";
import { Reveal } from "@/components/reveal";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";
import { THEMES } from "@/lib/themes";

/*
 * Landing — rediseño "producto moderno".
 *
 * Se abandona la maqueta tipo pieza impresa (reglas de pelo, grano de papel,
 * versalitas monoespaciadas) por un lenguaje de SaaS actual:
 *  · Superficies con esquinas suaves y sombras difusas y ligeras.
 *  · Tarjetas en lugar de celdas con reglas interiores.
 *  · Badges tipo "pill" en vez de cejas monoespaciadas.
 *  · Un velo de color suave en el hero y en el cierre para dar profundidad.
 *
 * Se conservan los tokens de color por theme (bg-primary, muted-foreground…)
 * porque los comparten el panel y los catálogos públicos; aquí sólo cambia la
 * forma, no la paleta.
 */

const STEPS = [
  {
    n: "01",
    title: "Sube la lista que ya tienes",
    body: "Importa tu CSV o Excel exportado. Reconoce encabezados en español, así que no tienes que renombrar columnas.",
  },
  {
    n: "02",
    title: "Arma el catálogo",
    body: "Elige qué productos entran, pon tu logo, escoge la apariencia y publícalo. Puedes tener varios catálogos distintos.",
  },
  {
    n: "03",
    title: "Manda el enlace",
    body: "Por WhatsApp o con un QR impreso en el mostrador. El pedido te llega al panel, ordenado y con los precios de hoy.",
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    label: "Comprador",
    title: "Pedidos sin crear cuenta",
    body: "Tu cliente no se registra ni descarga nada: abre el enlace, arma el pedido y lo envía.",
  },
  {
    icon: Tag,
    label: "Precios",
    title: "Una sola fuente de verdad",
    body: "Cambias el precio una vez y todos tus catálogos quedan actualizados. Nadie pide sobre una lista vieja.",
  },
  {
    icon: Zap,
    label: "Móvil",
    title: "Pensado para el chat",
    body: "Se abre dentro de WhatsApp, en un teléfono de gama media y con datos móviles. Ahí es donde te compran.",
  },
  {
    icon: Boxes,
    label: "Mayoreo",
    title: "Mínimos y presentaciones",
    body: "Caja de 24, bulto de 50, mínimo de 10 piezas: el catálogo respeta tus reglas de venta al por mayor.",
  },
  {
    icon: QrCode,
    label: "Difusión",
    title: "Enlace, QR e imprimible",
    body: "El mismo catálogo sirve para el chat, para pegar el QR en el mostrador y para imprimirlo en una hoja.",
  },
  {
    icon: Link2,
    label: "Marca",
    title: "Tu nombre arriba, no el nuestro",
    body: "Logo, banner y una apariencia distinta según lo que vendas. Cinco, elegidas por rubro.",
  },
];

const STATS = [
  { n: "10 min", l: "de Excel a catálogo publicado" },
  { n: "0", l: "apps que instalar, tú o tu cliente" },
  { n: "5", l: "apariencias según tu rubro" },
  { n: "24/7", l: "recibiendo pedidos" },
];

/** Previsualización del producto: una tarjeta de catálogo, con profundidad. */
function PriceListPreview() {
  const rows = [
    { name: "Coca-Cola 600 ml", sku: "CC-600", price: "12.50", unit: "caja 24", qty: 24 },
    { name: "Galleta María 170 g", sku: "GM-170", price: "18.00", unit: "bulto 12", qty: 0 },
    { name: "Aceite vegetal 1 L", sku: "AV-1000", price: "34.90", unit: "caja 12", qty: 12 },
    { name: "Atún en agua 140 g", sku: "AT-140", price: "21.00", unit: "bulto 48", qty: 0 },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5 ring-1 ring-foreground/5">
      {/* Encabezado del catálogo */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 p-4">
        <Monogram letter="D" className="size-10 rounded-xl text-base" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Distribuidora El Sol</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Lista vigente · Mayoreo</p>
        </div>
        <span className="hidden rounded-full bg-success/15 px-2.5 py-1 text-[0.6875rem] font-medium text-success sm:inline">
          En línea
        </span>
      </div>

      {/* Renglones */}
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.sku} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium">{r.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {r.sku} · {r.unit}
              </p>
            </div>
            <span className="text-[0.9375rem] font-semibold tabular-nums">${r.price}</span>
            {r.qty > 0 ? (
              <span className="flex items-center" aria-hidden="true">
                <span className="flex size-7 items-center justify-center rounded-l-lg border border-input text-muted-foreground">
                  <Minus className="size-3" />
                </span>
                <span className="flex h-7 w-9 items-center justify-center border-y border-input text-xs tabular-nums">
                  {r.qty}
                </span>
                <span className="flex size-7 items-center justify-center rounded-r-lg border border-input text-muted-foreground">
                  <Plus className="size-3" />
                </span>
              </span>
            ) : (
              <span
                className="flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-on-primary"
                aria-hidden="true"
              >
                <Plus className="size-3" />
                <span className="text-[0.6875rem] font-medium">Añadir</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Pie: total y aviso */}
      <div className="flex items-baseline justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3">
        <span className="text-xs text-muted-foreground">Total del pedido</span>
        <span className="text-lg font-semibold tabular-nums">$718.80</span>
      </div>
      <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
        El pedido llega a tu panel y al WhatsApp
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* ══ Barra superior ════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5 lg:px-8">
          <Link href="/" aria-label={siteConfig.name}>
            <Wordmark />
          </Link>

          <nav aria-label="Secciones" className="ml-6 hidden gap-7 md:flex">
            {[
              { href: "#como", label: "Cómo funciona" },
              { href: "#porque", label: "Por qué" },
              { href: "#planes", label: "Precios" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <Link
              href="/login"
              className="hidden h-10 items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/login?tab=signup"
              className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-on-primary shadow-sm transition-all hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)] hover:shadow-md"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        {/* ══ Hero ════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Velo de color suave para dar profundidad sin degradado chillón. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
            style={{
              background:
                "radial-gradient(60rem 40rem at 85% -10%, var(--primary), transparent 60%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                Para mayoristas y distribuidores
              </span>

              <h1 className="mt-6 text-[clamp(2.5rem,6.4vw,4.5rem)] font-bold leading-[1.02] tracking-tight">
                Deja de mandar el Excel por{" "}
                <span className="text-primary">WhatsApp.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {siteConfig.name} convierte tu lista de precios en un catálogo con enlace
                propio. Tu cliente entra, arma el pedido y te llega ordenado: sin instalar
                nada y sin crear cuenta.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-4">
                <Link
                  href="/login?tab=signup"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[0.9375rem] font-medium text-on-primary shadow-md transition-all hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)] hover:shadow-lg"
                >
                  Crear mi catálogo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href="#como"
                  className="inline-flex h-12 items-center rounded-full border border-input px-6 text-[0.9375rem] font-medium transition-colors hover:bg-muted"
                >
                  Ver cómo funciona
                </a>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Gratis para siempre · Sin tarjeta
              </p>
            </div>

            <div className="lg:col-span-5">
              <Reveal>
                <PriceListPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ Cifras ══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-muted/30">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 py-10 md:grid-cols-4 lg:px-8">
            {STATS.map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <dt className="text-2xl font-bold tabular-nums md:text-3xl">{s.n}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{s.l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ══ Cita ════════════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <Reveal>
              <blockquote className="mx-auto max-w-3xl text-center">
                <p className="text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
                  “Un pedido por WhatsApp son catorce mensajes, tres capturas de pantalla y
                  un precio que ya no existe.”
                </p>
                <footer className="mt-5 text-sm text-muted-foreground">
                  Lo que escuchamos en cada bodega que visitamos
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* ══ Cómo funciona ═══════════════════════════════════════════════ */}
        <section id="como" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
            <div className="max-w-lg">
              <span className="text-sm font-semibold text-primary">Cómo funciona</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Tres pasos, una tarde.
              </h2>
            </div>

            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 70}>
                  <li className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary tabular-nums">
                      {s.n}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ══ Por qué ═════════════════════════════════════════════════════ */}
        <section id="porque" className="scroll-mt-20 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-primary">Por qué</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Hecho para vender al por mayor, no para parecer una tienda.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                      {f.label}
                    </p>
                    <h3 className="mt-1 text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ Apariencias ═════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
            <div className="max-w-xl">
              <span className="text-sm font-semibold text-primary">Apariencia</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Cinco, elegidas por rubro.
              </h2>
              <p className="mt-3 text-muted-foreground">
                No es un muestrario de colores: cada una cambia paleta, esquinas y
                temperatura. Pruébalas aquí mismo con el selector de arriba.
              </p>
            </div>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {THEMES.map((t) => (
                <li
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-16 w-full overflow-hidden rounded-xl border border-border">
                    <span className="h-full flex-1" style={{ background: t.swatch.background }} />
                    <span className="h-full flex-1" style={{ background: t.swatch.primary }} />
                    <span className="h-full w-3" style={{ background: t.swatch.accent }} />
                  </span>
                  <p className="mt-3 text-base font-semibold">{t.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ Precios ═════════════════════════════════════════════════════ */}
        <section id="planes" className="scroll-mt-20 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
            <div className="max-w-xl">
              <span className="text-sm font-semibold text-primary">Precios</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Empieza gratis. Paga cuando crezcas.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {PLAN_ORDER.map((tier) => {
                const plan = PLANS[tier];
                return (
                  <div
                    key={tier}
                    className={
                      plan.highlighted
                        ? "relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg xl:-mt-3 xl:mb-3"
                        : "flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
                    }
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-on-primary">
                        Recomendado
                      </span>
                    )}

                    <h3 className="text-base font-semibold">{plan.name}</h3>

                    <p className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tabular-nums">{plan.priceLabel}</span>
                      {tier !== "free" && (
                        <span className="text-sm text-muted-foreground">/mes</span>
                      )}
                    </p>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[0.8125rem]">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login?tab=signup"
                      className={
                        plan.highlighted
                          ? "mt-7 inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-on-primary shadow-sm transition-all hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)] hover:shadow-md"
                          : "mt-7 inline-flex h-11 items-center justify-center rounded-full border border-input px-4 text-sm font-medium transition-colors hover:bg-muted"
                      }
                    >
                      {tier === "free" ? "Empezar gratis" : `Elegir ${plan.name}`}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Los planes de pago se cobran con Paddle. Puedes cambiar o cancelar cuando
              quieras.
            </p>
          </div>
        </section>

        {/* ══ Cierre ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-secondary text-on-secondary">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(50rem 30rem at 20% 120%, var(--primary), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold opacity-70">Último paso</span>
              <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
                Publica tu catálogo esta tarde.
              </h2>
              <p className="mt-6 max-w-lg text-lg opacity-80">
                Trae el archivo que ya usas. En diez minutos tienes un enlace que puedes
                mandar a tus clientes.
              </p>
              <Link
                href="/login?tab=signup"
                className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[0.9375rem] font-medium text-on-primary shadow-lg transition-all hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
              >
                Crear cuenta gratis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══ Pie ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 lg:px-8">
          <Wordmark size="sm" />
          <p className="text-sm text-muted-foreground">
            {siteConfig.domain} · {siteConfig.tagline}
          </p>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
