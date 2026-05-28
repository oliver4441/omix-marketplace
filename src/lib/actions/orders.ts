"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COMMISSION_RATE, DELIVERY_ZONES } from "@/lib/constants";

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const productId = formData.get("product_id") as string;
  const deliveryZoneId = parseInt(formData.get("delivery_zone_id") as string);
  const deliveryAddress = formData.get("delivery_address") as string;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (!product) return { error: "Product not found" };

  const zone = DELIVERY_ZONES.find((z) => z.id === deliveryZoneId);
  const deliveryFee = zone ? zone.fee * 100 : 0; // convert to cents
  const commission = Math.round(product.price * COMMISSION_RATE);
  const totalAmount = product.price + deliveryFee;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      product_id: productId,
      buyer_id: user.id,
      seller_id: product.seller_id,
      amount: totalAmount,
      commission,
      delivery_fee: deliveryFee,
      delivery_address: deliveryAddress,
      status: "pending_payment",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { orderId: order.id, amount: totalAmount };
}

export async function submitReceipt(orderId: string, receipt: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("orders")
    .update({ mpesa_receipt: receipt })
    .eq("id", orderId)
    .eq("buyer_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}
