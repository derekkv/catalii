import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Nota: en Next 16 `proxy.ts` corre en runtime Node (aún no soportado por
// OpenNext/Cloudflare Workers). Usamos `middleware.ts`, que corre en Edge y sí
// es compatible con Workers. El código sólo usa Web APIs (fetch/cookies).
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * - _next/static, _next/image
     * - favicon, robots, sitemap
     * - archivos con extensión (imágenes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
