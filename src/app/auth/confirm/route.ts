import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirma enlaces de email de Supabase (registro, cambio de email y
 * recuperación de contraseña). Soporta ambos formatos de enlace:
 *  - PKCE:      ?code=...            → exchangeCodeForSession
 *  - Token OTP: ?token_hash=&type=  → verifyOtp
 * Crea la sesión y redirige a `next` (solo rutas internas).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Evita open-redirect: solo rutas internas relativas.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
