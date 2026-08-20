import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";

/** Devuelve el usuario autenticado o null (revalidado contra Auth). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Devuelve el business del usuario actual, o null si aún no creó uno. */
export async function getBusiness(): Promise<Business | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("business")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (data as Business) ?? null;
}

/**
 * Exige sesión + business. Redirige a /login si no hay sesión y a
 * /dashboard/onboarding si hay sesión pero aún no hay negocio.
 */
export async function requireBusiness(): Promise<Business> {
  const user = await getUser();
  if (!user) redirect("/login");

  const business = await getBusiness();
  if (!business) redirect("/dashboard/onboarding");
  return business;
}
