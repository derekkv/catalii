import Link from "next/link";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Wordmark, Monogram } from "@/components/brand/wordmark";
import { Reveal } from "@/components/reveal";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";
import { THEMES } from "@/lib/themes";

/*
 * Landing.
 *
 * Maquetada como una pieza impresa, no como una secuencia de tarjetas:
 *  · Cabecera tipo masthead con reglas superior e inferior.
 *  · Retícula asimétrica 7/5 en el hero; el bloque de producto sangra a la
 *    derecha en lugar de quedar centrado y enmarcado.
 *  · Separación por reglas de pelo. Ninguna sombra difusa, ningún degradado.
 *  · Numeración y rótulos en versalitas monoespaciadas.
 *  · Un bloque de cita a sangría para romper el ritmo a un tercio de la
 *    página, que es donde se pierde la atención.
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
  { n: "10 min", l: "de Excel a catálogo publicado" },
  { n: "0", l: "apps que instalar, tú o tu cliente" },
  { n: "5", l: "apariencias según tu rubro" },
  { n: "24/7", l: "recibiendo pedidos" },
];

/** Previsualización: una lista de precios impresa, no una rejilla de colores. */
function PriceListPreview() {
  const rows = [
    { name: "Coca-Cola 600 ml", sku: "CC-600", price: "12.50", unit: "caja 24", qty: 24 },
    { name: "Galleta María 170 g", sku: "GM-170", price: "18.00", unit: "bulto 12", qty: 0 },
    { name: "Aceite vegetal 1 L", sku: "AV-1000", price: "34.90", unit: "caja 12", qty: 12 },
    { name: "Atún en agua 140 g", sku: "AT-140", price: "21.00", unit: "bulto 48", qty: 0 },
  ];

  return (
    <div className="border border-border bg-card">
      {/* Encabezado del documento */}
      <div className="flex items-center gap-3 rule-b p-4">
        <Monogram letter="D" className="size-9 text-base" />
        <div className="min-w-0 flex-1">
          <p className="t-h3 truncate">Distribuidora El Sol</p>
          <p className="t-label mt-1 text-muted-foreground">Lista vigente · Mayoreo</p>
        </div>
      </div>

      {/* Renglones */}
      <ul>
        {rows.map((r, i) => (
          <li
            key={r.sku}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "rule-t" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium">{r.name}</p>
              <p className="t-label mt-1 truncate text-muted-foreground">
                {r.sku} · {r.unit}
              </p>
            </div>
            <span className="t-price text-[0.9375rem]">${r.price}</span>
            {/* Los renglones sin cantidad muestran el botón de añadir, no un
                cero: un 0 dentro del selector se lee como un fallo. */}
            {r.qty > 0 ? (
              <span className="flex items-center" aria-hidden="true">
                <span className="flex size-7 items-center justify-center border border-input text-muted-foreground">
                  <Minus className="size-3" />
                </span>
                <span className="t-num flex h-7 w-9 items-center justify-center border-y border-input text-xs">
                  {r.qty}
                </span>
                <span className="flex size-7 items-center justify-center border border-input text-muted-foreground">
                  <Plus className="size-3" />
                </span>
              </span>
            ) : (
              <span
                className="flex h-7 items-center gap-1 bg-primary px-2.5 text-on-primary"
                aria-hidden="true"
              >
                <Plus className="size-3" />
                <span className="t-label">Añadir</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Pie: total y aviso */}
      <div className="flex items-baseline justify-between gap-3 rule-t bg-muted px-4 py-3">
        <span className="t-label text-muted-foreground">Total del pedido</span>
        <span className="t-price text-lg">$718.80</span>
      </div>
      <p className="t-label rule-t px-4 py-3 text-center text-muted-foreground">
        El pedido llega a tu panel y al WhatsApp
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="grain flex min-h-screen flex-col overflow-x-hidden">
      {/* ══ Masthead ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5 lg:px-8">
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
                className="t-label text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <Link
              href="/login"
              className="t-label hidden h-11 items-center px-3 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/login?tab=signup"
              className="inline-flex h-11 items-center rounded-[var(--radius-theme-sm)] bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        {/* ══ Hero ════════════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="lg:col-span-7">
              <p className="t-eyebrow">Para mayoristas y distribuidores</p>

              <h1 className="t-display mt-6">
                Deja de mandar
                <br />
                el Excel por
                <br />
                <span className="text-primary">WhatsApp.</span>
              </h1>

              <p className="t-lead mt-7 max-w-xl text-muted-foreground">
                {siteConfig.name} convierte tu lista de precios en un catálogo con enlace
                propio. Tu cliente entra, arma el pedido y te llega ordenado: sin instalar
                nada y sin crear cuenta.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href="/login?tab=signup"
                  className="inline-flex h-13 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-6 text-[0.9375rem] font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
                >
                  Crear mi catálogo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {/* Secundario como enlace, no como segundo botón: dos botones
                    del mismo peso anulan la jerarquía de la llamada. */}
                <a href="#como" className="link-ink text-sm font-medium">
                  Ver cómo funciona
                </a>
              </div>

              <p className="t-label mt-7 text-muted-foreground">
                Gratis para siempre · Sin tarjeta
              </p>
            </div>

            {/* El bloque sangra a la derecha en pantallas grandes. */}
            <div className="lg:col-span-5 lg:-mr-6 xl:-mr-16">
              <Reveal>
                <PriceListPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ Cifras ══════════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.l}
                className={`px-5 py-7 lg:px-8 ${i % 2 === 1 ? "border-l border-border" : ""} ${
                  i >= 2 ? "border-t border-border md:border-t-0" : ""
                } md:border-l md:first:border-l-0`}
              >
                <dt className="t-num text-2xl md:text-3xl">{s.n}</dt>
                <dd className="t-small mt-1.5 text-muted-foreground">{s.l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ══ Cita a sangría ══════════════════════════════════════════════ */}
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

        {/* ══ Cómo funciona ═══════════════════════════════════════════════ */}
        <section id="como" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <p className="t-eyebrow">Cómo funciona</p>
            <h2 className="t-h1 mt-5 max-w-lg">Tres pasos, una tarde.</h2>

            <ol className="mt-12 grid gap-px md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 70}>
                  <li className="h-full border-t-2 border-foreground pt-5 md:pr-7">
                    <span className="t-num text-4xl text-primary">{s.n}</span>
                    <h3 className="t-h2 mt-3">{s.title}</h3>
                    <p className="t-body mt-2.5 text-muted-foreground">{s.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ══ Por qué ═════════════════════════════════════════════════════ */}
        <section id="porque" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="t-eyebrow">Por qué</p>
              <h2 className="t-h1 mt-5">
                Hecho para vender al por mayor, no para parecer una tienda.
              </h2>
            </div>

            {/* Rejilla con reglas interiores: se lee como una ficha técnica. */}
            <div className="grid-ruled mt-12 grid sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-6">
                  <p className="t-label text-primary">{f.label}</p>
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
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="t-eyebrow">Apariencia</p>
                <h2 className="t-h1 mt-5">Cinco, elegidas por rubro.</h2>
                <p className="t-body mt-3 text-muted-foreground">
                  No es un muestrario de colores: cada una cambia paleta, esquinas y
                  temperatura del papel. Pruébalas aquí mismo con el selector de arriba.
                </p>
              </div>
            </div>

            <ul className="grid-ruled mt-10 grid sm:grid-cols-2 lg:grid-cols-5">
              {THEMES.map((t) => (
                <li key={t.id} className="p-5">
                  {/* Muestra con los tres tonos del theme, apiladas como tintas. */}
                  <span className="flex h-16 w-full overflow-hidden rounded-[2px] border border-border">
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
            <div className="max-w-xl">
              <p className="t-eyebrow">Precios</p>
              <h2 className="t-h1 mt-5">Empieza gratis. Paga cuando crezcas.</h2>
            </div>

            <div className="grid-ruled mt-12 grid md:grid-cols-2 xl:grid-cols-4">
              {PLAN_ORDER.map((tier) => {
                const plan = PLANS[tier];
                return (
                  <div key={tier} className="flex flex-col p-6">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="t-h3">{plan.name}</h3>
                      {plan.highlighted && (
                        <span className="t-label text-primary">Recomendado</span>
                      )}
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
                      className={
                        plan.highlighted
                          ? "mt-7 inline-flex h-11 items-center justify-center rounded-[var(--radius-theme-sm)] bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
                          : "mt-7 inline-flex h-11 items-center justify-center rounded-[var(--radius-theme-sm)] border border-input px-4 text-sm font-medium transition-colors hover:bg-muted"
                      }
                    >
                      {tier === "free" ? "Empezar gratis" : `Elegir ${plan.name}`}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="t-small mt-6 text-muted-foreground">
              Los planes de pago se cobran con Paddle. Puedes cambiar o cancelar cuando
              quieras.
            </p>
          </div>
        </section>

        {/* ══ Cierre ══════════════════════════════════════════════════════
            Banda de tinta plena. Un color sólido, no un degradado de dos
            tonos: el degradado es el acabado más delator de todos.        */}
        <section className="bg-secondary text-on-secondary">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
            <div className="max-w-2xl">
              <p className="t-eyebrow opacity-70">Último paso</p>
              <h2 className="t-display mt-6">Publica tu catálogo esta tarde.</h2>
              <p className="t-lead mt-6 max-w-lg opacity-80">
                Trae el archivo que ya usas. En diez minutos tienes un enlace que puedes
                mandar a tus clientes.
              </p>
              <Link
                href="/login?tab=signup"
                className="mt-9 inline-flex h-13 items-center gap-2 rounded-[var(--radius-theme-sm)] bg-primary px-6 text-[0.9375rem] font-medium text-on-primary transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
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
          <p className="t-label text-muted-foreground">
            {siteConfig.domain} · {siteConfig.tagline}
          </p>
          <p className="t-label text-muted-foreground">
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
