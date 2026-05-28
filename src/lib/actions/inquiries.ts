"use server";
import { createClient } from "@/lib/supabase/server";

export async function sendInquiry(productId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first" };

  const { error } = await supabase.from("inquiries").insert({
    product_id: productId,
    buyer_id: user.id,
    message,
  });
  if (error) return { error: error.message };
  return { success: true };
}
