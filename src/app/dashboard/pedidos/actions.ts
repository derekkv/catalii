"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validation";

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const business = await getBusiness();
  if (!business) return;
  const id = String(formData.get("id") ?? "");
  const status = orderStatusSchema.safeParse(formData.get("status"));
  if (!id || !status.success) return;

  const supabase = await createClient();
  await supabase
    .from("order")
    .update({ status: status.data })
    .eq("id", id)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard");
}
