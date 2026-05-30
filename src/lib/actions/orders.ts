"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const COMMISSION_RATE = 0.05;

function formatPrice(cents: number): string {
  return `KES ${Math.round(cents).toLocaleString()}`;
}

// =============================================
// CREATE ORDER — Get listing, calculate 5% commission, insert with status 'pending'
// =============================================
export async function createOrder(
  listingId: string,
  buyerId: string
) {
  const supabase = await createClient();

  // Fetch listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id, price, title")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return { error: "Listing not found" };
  }

  if (listing.seller_id === buyerId) {
    return { error: "Cannot buy your own listing" };
  }

  const amountCents = listing.price;
  const commissionCents = Math.round(amountCents * COMMISSION_RATE);
  const sellerEarnsCents = amountCents - commissionCents;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount_cents: amountCents,
      commission_cents: commissionCents,
      seller_earns_cents: sellerEarnsCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/orders/${order.id}`);

  return { success: true, orderId: order.id };
}

// =============================================
// GET BUYER ORDERS — Orders where userId is buyer, with listing and seller info
// =============================================
export async function getBuyerOrders(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, listings!orders_listing_id_fkey(id, title, price, listing_images(*)), profiles!orders_seller_id_fkey(id, full_name, avatar_url, store_slug)"
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getBuyerOrders error:", error);
    return [];
  }

  return data || [];
}

// =============================================
// GET SELLER ORDERS — Orders where userId is seller, with listing and buyer info
// =============================================
export async function getSellerOrders(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, listings!orders_listing_id_fkey(id, title, price, listing_images(*)), profiles!orders_buyer_id_fkey(id, full_name, avatar_url)"
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSellerOrders error:", error);
    return [];
  }

  return data || [];
}

// =============================================
// UPDATE ORDER STATUS — Update status and optional shipping_tracking
// =============================================
export async function updateOrderStatus(
  orderId: string,
  status: string,
  tracking?: string
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (tracking !== undefined) {
    updates.shipping_tracking = tracking;
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// =============================================
// CONFIRM DELIVERY — Set buyer_confirmed_receipt=true and status='completed'
// =============================================
export async function confirmDelivery(orderId: string, buyerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      buyer_confirmed_receipt: true,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("buyer_id", buyerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// =============================================
// DISPUTE ORDER — Insert into disputes table and update order status to 'disputed'
// =============================================
export async function disputeOrder(
  orderId: string,
  userId: string,
  reason: string
) {
  const supabase = await createClient();

  // Insert into disputes table
  const { error: disputeError } = await supabase
    .from("disputes")
    .insert({
      order_id: orderId,
      reported_by: userId,
      reason,
      status: "open",
    });

  if (disputeError) {
    return { error: disputeError.message };
  }

  // Update order status to 'disputed'
  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "disputed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("buyer_id", userId);

  if (orderError) {
    return { error: orderError.message };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");

  return { success: true };
}
