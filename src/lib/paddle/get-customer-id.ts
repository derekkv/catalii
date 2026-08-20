import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Devuelve el customer_id de Paddle del usuario actual (por email), o "". */
export async function getCustomerId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return "";

  const { data } = await supabase
    .from("paddle_customer")
    .select("customer_id")
    .eq("email", email)
    .maybeSingle();

  return data?.customer_id ?? "";
}
