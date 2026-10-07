import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BookOpen,
  Settings,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Wordmark, Monogram } from "@/components/brand/wordmark";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

/*
 * Landing — mismo lenguaje que el panel.
 *
 * La landing deja de tener su propio estilo "SaaS genérico" y adopta el
 * sistema del dashboard (papel de imprenta comercial):
 *  · Cejas en versalitas (.t-eyebrow), títulos en serif (.t-h1) y regla de
 *    cierre, igual que <PageHeader>.
 *  · Cifras con <StatTiles>: reglas verticales, rótulo t-label y t-num.
 *  · Pasos como el <SetupChecklist>: ordinal monoespaciado y regla por paso.
 *  · Rejillas con reglas interiores (.grid-ruled) en lugar de tarjetas con
 *    sombra. Radios del theme (--radius-theme-sm), sin píldoras.
 *  · El hero muestra el propio panel, para que lo que ve el visitante sea lo
 *    que encontrará al entrar.
 */

const STEPS = [
  {
    title: "Sube la lista que ya tienes",
    body: "Importa tu CSV o Excel exportado. Reconoce encabezados en español, así que no tienes que renombrar columnas.",
  },
  {
    title: "Arma el catálogo",
    body: "Elige qué productos entran, pon tu logo, escoge la apariencia y publícalo. Puedes tener varios catálogos distintos.",
  },
  {
    title: "Manda el enlace",
    body: "Por WhatsApp o con un QR impreso en el mostrador. El pedido te llega al panel, ordenado y con los precios de hoy.",
  },
];

const FEATURES = [
  {
    label: "Comprador",
    title: "Pedidos sin crear cuenta",
    body: "Tu cliente no se registra ni descarga nada: abre el enlace, arma el pedido y lo envía.",
  },
  {
    label: "Precios",
    title: "Una sola fuente de verdad",
    body: "Cambias el precio una vez y todos tus catálogos quedan actualizados. Nadie pide sobre una lista vieja.",
  },
  {
    label: "Móvil",
    title: "Pensado para el chat",
    body: "Se abre dentro de WhatsApp, en un teléfono de gama media y con datos móviles. Ahí es donde te compran.",
  },
  {
    label: "Mayoreo",
    title: "Mínimos y presentaciones",
    body: "Caja de 24, bulto de 50, mínimo de 10 piezas: el catálogo respeta tus reglas de venta al por mayor.",
  },
  {
    label: "Difusión",
    title: "Enlace, QR e imprimible",
    body: "El mismo catálogo sirve para el chat, para pegar el QR en el mostrador y para imprimirlo en una hoja.",
  },
  {
    label: "Marca",
    title: "Tu nombre arriba, no el nuestro",
    body: "Logo, banner y una apariencia distinta según lo que vendas. Cinco, elegidas por rubro.",
  },
];

const STATS = [
  { label: "Excel → catálogo", value: "10 min", hint: "de archivo a enlace publicado" },
  { label: "Apps que instalar", value: "0", hint: "ni tú ni tu cliente" },
  { label: "Apariencias", value: "5", hint: "elegidas según tu rubro" },
  { label: "Recibiendo pedidos", value: "24/7", hint: "aunque tengas cerrado" },
];

/* Clases de botón idénticas a las del panel (ver components/ui/button.tsx). */
const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-theme-sm)] font-medium transition-[background-color,border-color,color,translate] duration-150 active:translate-y-px";
const btnPrimary = cn(
  btnBase,
  "bg-primary text-on-primary hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]",
);
const btnOutline = cn(btnBase, "border border-input text-foreground hover:bg-muted");

/** Cabecera de sección: misma anatomía que <PageHeader> del panel, con h2. */
function SectionHeader({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <header className="rule-b pb-5">
      <p className="t-eyebrow">{eyebrow}</p>
      <h2 id={id} className="t-h1 mt-3 max-w-2xl">
        {title}
      </h2>
      {description && (
        <p className="t-body mt-2 max-w-xl text-muted-foreground">{description}</p>
      )}
    </header>
  );
}

/**
 * Vista previa del panel: barra lateral, cabecera de página, métricas y
 * registro de pedidos, con las mismas piezas que /dashboard. Es decorativa
 * (aria-hidden) y estática.
 */
function DashboardPreview() {
  const nav = [
    { label: "Resumen", icon: LayoutDashboard, active: true },
    { label: "Productos", icon: Package },
    { label: "Pedidos", icon: ShoppingCart },
    { label: "Catálogos", icon: BookOpen },
    { label: "Ajustes", icon: Settings },
  ];
  const orders = [
    { date: "07 oct", name: "Abarrotes Lupita", tone: "warning", status: "Pendiente", total: "$718.80" },
    { date: "07 oct", name: "Tienda Don Beto", tone: "primary", status: "Confirmado", total: "$1,240.00" },
    { date: "06 oct", name: "Minisúper La Esquina", tone: "success", status: "Enviado", total: "$2,315.50" },
  ] as const;

  return (
    <div
      aria-hidden="true"
      className="shadow-lift overflow-hidden rounded-[var(--radius-theme)] border border-border bg-background"
    >
      {/* Barra de ventana */}
      <div className="flex items-center gap-1.5 rule-b bg-muted px-3 py-2">
        <span className="size-2 rounded-full bg-input" />
        <span className="size-2 rounded-full bg-input" />
        <span className="size-2 rounded-full bg-input" />
        <span className="t-label ml-3 truncate text-muted-foreground">
          {siteConfig.domain}/dashboard
        </span>
      </div>

      <div className="flex">
        {/* Lateral */}
        <div className="hidden w-36 shrink-0 flex-col border-r border-border sm:flex">
          <div className="rule-b px-3.5 py-3">
            <Wordmark size="sm" className="text-base" />
          </div>
          <div className="py-2">
            {nav.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2.5 border-l-2 py-2 pl-3 pr-2",
                  active
                    ? "border-primary bg-muted text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="t-label text-[0.625rem]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1 space-y-4 p-4">
          <div className="rule-b pb-3">
            <p className="t-eyebrow text-[0.625rem]">Distribuidora El Sol</p>
            <p className="t-h2 mt-2">1 pedido por atender</p>
          </div>

          <dl className="grid grid-cols-3 border-y border-border">
            {[
              { l: "Por atender", v: "1", accent: true },
              { l: "Del mes", v: "38" },
              { l: "Productos", v: "214" },
            ].map((s, i) => (
              <div key={s.l} className={cn("px-2.5 py-2.5", i > 0 && "border-l border-border")}>
                <dt className="t-label truncate text-[0.5625rem] text-muted-foreground">{s.l}</dt>
                <dd className={cn("t-num mt-1.5 text-lg leading-none", s.accent && "text-accent")}>
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="t-h3 text-sm">Últimos pedidos</p>
            <ul className="mt-2 border-y border-border">
              {orders.map((o, i) => (
                <li key={o.name} className={cn("flex items-center gap-2.5 py-2", i > 0 && "rule-t")}>
                  <span className="t-num w-10 shrink-0 text-[0.6875rem] text-muted-foreground">
                    {o.date}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{o.name}</span>
                  <Badge tone={o.tone} className="hidden text-[0.5625rem] md:inline-flex">
                    {o.status}
                  </Badge>
                  <span className="t-price w-16 shrink-0 text-right text-xs">{o.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lo que ve el comprador: el catálogo público, con las fichas del sistema. */
function PriceListPreview() {
  const rows = [
    { name: "Coca-Cola 600 ml", sku: "CC-600", price: "12.50", unit: "caja 24", qty: 24 },
    { name: "Galleta María 170 g", sku: "GM-170", price: "18.00", unit: "bulto 12", qty: 0 },
    { name: "Aceite vegetal 1 L", sku: "AV-1000", price: "34.90", unit: "caja 12", qty: 12 },
  ];

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[var(--radius-theme)] border border-border bg-card"
    >
      <div className="flex items-center gap-3 rule-b p-4">
        <Monogram letter="D" className="size-9 text-base" />
        <div className="min-w-0 flex-1">
          <p className="t-h3 truncate">Distribuidora El Sol</p>
          <p className="t-label mt-1 text-muted-foreground">Lista vigente · Mayoreo</p>
        </div>
      </div>

      <ul>
        {rows.map((r, i) => (
          <li key={r.sku} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "rule-t")}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium">{r.name}</p>
              <p className="t-label mt-1 truncate text-muted-foreground">
                {r.sku} · {r.unit}
              </p>
            </div>
            <span className="t-price text-[0.9375rem]">${r.price}</span>
            {r.qty > 0 ? (
              <span className="flex items-center">
                <span className="flex size-7 items-center justify-center rounded-l-[var(--radius-theme-sm)] border border-input text-muted-foreground">
                  <Minus className="size-3" />
                </span>
                <span className="t-num flex h-7 w-9 items-center justify-center border-y border-input text-xs">
                  {r.qty}
                </span>
                <span className="flex size-7 items-center justify-center rounded-r-[var(--radius-theme-sm)] border border-input text-muted-foreground">
                  <Plus className="size-3" />
                </span>
              </span>
            ) : (
              <span className="flex h-7 items-center gap-1 rounded-[var(--radius-theme-sm)] bg-primary px-2.5 text-on-primary">
                <Plus className="size-3" />
                <span className="t-label">Añadir</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-3 rule-t bg-muted px-4 py-3">
        <span className="t-label text-muted-foreground">Total del pedido</span>
        <span className="t-price text-lg">$718.80</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* ══ Cabecera: misma barra que el panel ════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-2.5 lg:px-8">
          <Link href="/" aria-label={siteConfig.name}>
            <Wordmark />
          </Link>

          <nav aria-label="Secciones" className="ml-6 hidden gap-6 md:flex">
            {[
              { href: "#como", label: "Cómo funciona" },
              { href: "#porque", label: "Por qué" },
              { href: "#planes", label: "Precios" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="t-label flex h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeSwitcher />
            <Link
              href="/login"
              className="t-label hidden h-11 items-center px-3 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Entrar
            </Link>
            <Link href="/login?tab=signup" className={cn(btnPrimary, "h-11 px-4 text-sm")}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        {/* ══ Hero ════════════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-20 lg:pt-16">
            <div className="lg:col-span-6">
              <p className="t-eyebrow">Para mayoristas y distribuidores</p>

              <h1 className="t-display mt-6">
                Deja de mandar el Excel por <span className="text-primary">WhatsApp.</span>
              </h1>

              <p className="t-lead mt-6 max-w-xl text-muted-foreground">
                {siteConfig.name} convierte tu lista de precios en un catálogo con enlace
                propio. Tu cliente entra, arma el pedido y te llega ordenado: sin instalar
                nada y sin crear cuenta.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  href="/login?tab=signup"
                  className={cn(btnPrimary, "h-13 px-6 text-[0.9375rem]")}
                >
                  Crear mi catálogo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a href="#como" className="link-ink text-sm font-medium">
                  Ver cómo funciona
                </a>
              </div>

              <p className="t-label mt-7 text-muted-foreground">
                Gratis para siempre · Sin tarjeta
              </p>
            </div>

            <div className="lg:col-span-6">
              <Reveal>
                <DashboardPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ Cifras: el mismo componente de métricas del panel ═══════════ */}
        <section>
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <StatTiles items={STATS} />
          </div>
        </section>

        {/* ══ Cita ════════════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <Reveal>
              <blockquote className="max-w-3xl border-l-2 border-primary pl-6 lg:pl-9">
                <p className="t-h1">
                  “Un pedido por WhatsApp son catorce mensajes, tres capturas de pantalla y
                  un precio que ya no existe.”
                </p>
                <footer className="t-label mt-5 text-muted-foreground">
                  Lo que escuchamos en cada bodega que visitamos
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* ══ Cómo funciona: sumario numerado como "Primeros pasos" ═══════ */}
        <section id="como" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-12 lg:px-8 lg:py-20">
            <div className="lg:col-span-7">
              <SectionHeader eyebrow="Cómo funciona" title="Tres pasos, una tarde." />

              <Reveal>
                <ol className="mt-6 border border-border bg-card">
                  <li className="flex flex-wrap items-baseline justify-between gap-2 rule-b px-5 py-4">
                    <span className="t-h3">Pon tu catálogo en marcha</span>
                    <span className="t-label text-muted-foreground">3 pasos</span>
                  </li>
                  {STEPS.map((s, i) => (
                    <li
                      key={s.title}
                      className={cn("flex items-start gap-4 px-5 py-5", i > 0 && "rule-t")}
                    >
                      <span className="t-num mt-0.5 w-6 shrink-0 text-sm text-primary">
                        0{i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium">{s.title}</h3>
                        <p className="t-small mt-1 text-muted-foreground">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>

            <div className="lg:col-span-5 lg:pt-24">
              <p className="t-label mb-3 text-muted-foreground">Lo que ve tu cliente</p>
              <Reveal delay={70}>
                <PriceListPreview />
              </Reveal>
              <p className="t-small mt-3 text-muted-foreground">
                El pedido llega a tu panel y al WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* ══ Por qué ═════════════════════════════════════════════════════ */}
        <section id="porque" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionHeader
              eyebrow="Por qué"
              title="Hecho para vender al por mayor, no para parecer una tienda."
            />

            <div className="grid-ruled mt-8 grid bg-card sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-6">
                  <Badge tone="primary">{f.label}</Badge>
                  <h3 className="t-h3 mt-3">{f.title}</h3>
                  <p className="t-small mt-2 text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Apariencias ═════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionHeader
              eyebrow="Apariencia"
              title="Cinco, elegidas por rubro."
              description="No es un muestrario de colores: cada una cambia paleta, esquinas y temperatura del papel. Pruébalas aquí mismo con el selector de arriba."
            />

            <ul className="grid-ruled mt-8 grid bg-card sm:grid-cols-2 lg:grid-cols-5">
              {THEMES.map((t) => (
                <li key={t.id} className="p-5">
                  <span className="flex h-16 w-full overflow-hidden rounded-[var(--radius-theme-sm)] border border-border">
                    <span className="h-full flex-1" style={{ background: t.swatch.background }} />
                    <span className="h-full flex-1" style={{ background: t.swatch.primary }} />
                    <span className="h-full w-3" style={{ background: t.swatch.accent }} />
                  </span>
                  <p className="t-h3 mt-3">{t.name}</p>
                  <p className="t-small mt-1 text-muted-foreground">{t.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ Precios ═════════════════════════════════════════════════════ */}
        <section id="planes" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionHeader eyebrow="Precios" title="Empieza gratis. Paga cuando crezcas." />

            <div className="grid-ruled mt-8 grid bg-card md:grid-cols-2 xl:grid-cols-4">
              {PLAN_ORDER.map((tier) => {
                const plan = PLANS[tier];
                return (
                  <div
                    key={tier}
                    className={cn(
                      "flex flex-col p-6",
                      plan.highlighted && "bg-muted shadow-[inset_0_2px_0_0_var(--primary)]",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="t-h3">{plan.name}</h3>
                      {plan.highlighted && <Badge tone="primary">Recomendado</Badge>}
                    </div>

                    <p className="mt-4 flex items-baseline gap-1.5">
                      <span className="t-price text-4xl">{plan.priceLabel}</span>
                      {tier !== "free" && (
                        <span className="t-label text-muted-foreground">/mes</span>
                      )}
                    </p>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[0.8125rem]">
                          <Check
                            className="mt-0.5 size-3.5 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login?tab=signup"
                      className={cn(
                        plan.highlighted ? btnPrimary : btnOutline,
                        "mt-7 h-11 px-4 text-sm",
                      )}
                    >
                      {tier === "free" ? "Empezar gratis" : `Elegir ${plan.name}`}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="t-small mt-4 text-muted-foreground">
              Los planes de pago se cobran con Paddle. Puedes cambiar o cancelar cuando
              quieras.
            </p>
          </div>
        </section>

        {/* ══ Cierre ══════════════════════════════════════════════════════ */}
        <section className="bg-secondary text-on-secondary">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="t-label opacity-70">Último paso</p>
              <h2 className="t-display mt-5">Publica tu catálogo esta tarde.</h2>
              <p className="t-lead mt-6 max-w-lg opacity-80">
                Trae el archivo que ya usas. En diez minutos tienes un enlace que puedes
                mandar a tus clientes.
              </p>
              <Link
                href="/login?tab=signup"
                className={cn(btnPrimary, "mt-9 h-13 px-6 text-[0.9375rem]")}
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 lg:px-8">
          <Wordmark size="sm" />
          <p className="t-label text-muted-foreground">
            {siteConfig.domain} · {siteConfig.tagline}
          </p>
          <p className="t-label text-muted-foreground">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
