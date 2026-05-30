"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first" };

  const orderId = formData.get("order_id") as string;
  const rating = parseInt(formData.get("rating") as string);
  const comment = formData.get("comment") as string;

  if (rating < 1 || rating > 5) return { error: "Rating must be 1-5" };

  // Verify the order belongs to this user and is completed
  const { data: order } = await supabase
    .from("orders")
    .select("seller_id, buyer_id, status")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.buyer_id !== user.id) return { error: "Not authorized" };
  if (order.status !== "completed")
    return { error: "Order must be completed before reviewing" };

  const { error } = await supabase.from("reviews").insert({
    order_id: orderId,
    reviewer_id: user.id,
    reviewee_id: order.seller_id,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already reviewed this order" };
    return { error: error.message };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/profiles/${order.seller_id}`);
  return { success: true };
}
