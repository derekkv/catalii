import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/*
 * Exportación de los datos del usuario autenticado (JSON).
 *
 * Se usa el cliente CON SESIÓN (RLS), no service-role: la propia base de
 * datos limita cada tabla a las filas del usuario. No incluye binarios de
 * imágenes (solo sus claves) ni secretos.
 */

export const dynamic = "force-dynamic";

const PAGE = 1000; // tope por petición de PostgREST

interface Source {
  key: string;
  table: string;
  order: string[];
}

const SOURCES: Source[] = [
  { key: "negocio", table: "business", order: ["id"] },
  { key: "productos", table: "product", order: ["id"] },
  { key: "catalogos", table: "catalog", order: ["id"] },
  { key: "catalogo_producto", table: "catalog_product", order: ["catalog_id", "product_id"] },
  { key: "listas_de_precios", table: "price_list", order: ["id"] },
  { key: "clientes", table: "customer", order: ["id"] },
  { key: "pedidos", table: "order", order: ["id"] },
  { key: "renglones_de_pedidos", table: "order_item", order: ["id"] },
  { key: "aceptaciones_legales", table: "legal_acceptance", order: ["id"] },
  { key: "paddle_clientes", table: "paddle_customer", order: ["customer_id"] },
  { key: "paddle_suscripciones", table: "paddle_subscription", order: ["subscription_id"] },
];

type Row = Record<string, unknown>;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  // Solo mismo origen: una navegación o petición de otro sitio no debe poder
  // disparar la descarga. (Los navegadores modernos envían Sec-Fetch-Site.)
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return fail(403, "Solicitud no permitida.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Inicia sesión para descargar tus datos.");

  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const src of SOURCES) {
    const rows: Row[] = [];
    let failed = false;
    for (let from = 0; ; from += PAGE) {
      let q = supabase.from(src.table).select("*");
      for (const col of src.order) q = q.order(col, { ascending: true });
      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error) {
        console.error(`[export] ${src.table}:`, error.code, error.message);
        errors.push(src.key);
        failed = true;
        break;
      }
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < PAGE) break;
    }
    if (!failed) result[src.key] = rows;
  }

  // Claves de imágenes (referencias; no se exportan los archivos).
  const keys = new Set<string>();
  const add = (v: unknown) => {
    if (typeof v === "string" && v) keys.add(v);
  };
  for (const b of (result.negocio as Row[] | undefined) ?? []) {
    add(b.logo_key);
    add(b.banner_key);
  }
  for (const c of (result.catalogos as Row[] | undefined) ?? []) {
    add(c.logo_key);
    add(c.banner_key);
  }
  for (const p of (result.productos as Row[] | undefined) ?? []) {
    if (Array.isArray(p.images)) {
      for (const img of p.images as Array<{ key?: unknown }>) add(img?.key);
    }
  }

  const payload = {
    exportado_en: new Date().toISOString(),
    cuenta: { id: user.id, email: user.email ?? null, created_at: user.created_at },
    ...result,
    claves_de_imagenes: [...keys].sort(),
    ...(errors.length ? { secciones_no_disponibles: errors } : {}),
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="catalii-mis-datos-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
