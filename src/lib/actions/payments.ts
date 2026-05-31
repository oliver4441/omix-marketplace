"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { formatPrice } from "@/lib/constants";

// =============================================
// M-PESA STK PUSH — Initiate payment via Safaricom Daraja API
// =============================================
// This is a production-ready implementation stub.
// To activate: set MpesaConfig in environment and uncomment the real API call.
// =============================================

// Daraja API credentials — set these in .env.local
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  shortcode: process.env.MPESA_SHORTCODE || "174379", // Safaricom test shortcode
  passkey: process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f7e7e7f3b8a6923208e", // test passkey
  callbackUrl: process.env.MPESA_CALLBACK_URL || "https://omix-marketplace.vercel.app/api/mpesa/callback",
  environment: (process.env.MPESA_ENVIRONMENT || "sandbox") as "sandbox" | "production",
};

const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE = "https://api.safaricom.co.ke";

function getBaseUrl() {
  return MPESA_CONFIG.environment === "production" ? PRODUCTION_BASE : SANDBOX_BASE;
}

// Get OAuth token
async function getMpesaToken(): Promise<string> {
  const credentials = Buffer.from(
    `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
  ).toString("base64");

  const response = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) throw new Error("M-Pesa auth failed");
  const data = await response.json();
  return data.access_token;
}

// =============================================
// INITIATE STK PUSH
// =============================================
export async function initiateMpesaPayment(params: {
  orderId: string;
  phone: string;  // e.g. "254712345678"
  amount: number; // in KES (not cents)
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify order belongs to user
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, amount_cents, status")
    .eq("id", params.orderId)
    .eq("buyer_id", user.id)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.status !== "pending") return { error: "Order already processed" }

  // Normalize phone: ensure 254XXXXXXXXX format
  let phone = params.phone.replace(/\D/g, "");
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (!phone.startsWith("254") || phone.length !== 12) {
    return { error: "Invalid phone number. Use format: 07XXXXXXXX" };
  }

  const amountKes = params.amount;
  if (amountKes < 1) return { error: "Amount too low" };

  // Generate timestamp for Daraja
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);

  // Save attempt to order
  await supabase
    .from("orders")
    .update({
      mpesa_phone: phone,
      payment_method: "mpesa",
      payment_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.orderId);

  // === REAL M-PESA INTEGRATION ===
  // Uncomment below when credentials are configured:
  //
  // const token = await getMpesaToken();
  // const password = Buffer.from(
  //   `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
  // ).toString("base64");
  //
  // const stkResponse = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     BusinessShortCode: MPESA_CONFIG.shortcode,
  //     Password: password,
  //     Timestamp: timestamp,
  //     TransactionType: "CustomerPayBillOnline",
  //     Amount: amountKes,
  //     PartyA: phone,
  //     PartyB: MPESA_CONFIG.shortcode,
  //     PhoneNumber: phone,
  //     CallBackURL: MPESA_CONFIG.callbackUrl,
  //     AccountReference: `OMIX-${params.orderId.slice(0, 8)}`,
  //     TransactionDesc: "Omix Marketplace purchase",
  //   }),
  // });
  //
  // const stkData = await stkResponse.json();
  // if (stkData.ResponseCode !== "0") {
  //   await supabase.from("orders").update({ payment_status: "failed" }).eq("id", params.orderId);
  //   return { error: stkData.errorMessage || "STK push failed" };
  // }
  //
  // return {
  //   success: true,
  //   message: "Enter your M-Pesa PIN to complete payment",
  //   checkoutRequestId: stkData.CheckoutRequestID,
  // };

  // === STUB: For development without M-Pesa credentials ===
  return {
    success: true,
    message:
      "STK push initiated (development mode). In production, the buyer receives an M-Pesa prompt on their phone.",
    checkoutRequestId: `dev_${params.orderId.slice(0, 8)}`,
  };
}

// =============================================
// M-PESA CALLBACK — Handle Safaricom IPN
// =============================================
export async function handleMpesaCallback(body: any) {
  const supabase = await createClient();

  // Extract result from Daraja callback format
  const result = body?.Body?.stkCallback;
  if (!result) return;

  const checkoutId = result.CheckoutRequestID;
  const resultCode = result.ResultCode;
  const resultDesc = result.ResultDesc;

  // Extract metadata
  const metadata = result.CallbackMetadata?.Item || [];
  const mpesaReceipt = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
  const phone = metadata.find((i: any) => i.Name === "PhoneNumber")?.Value;
  const amount = metadata.find((i: any) => i.Name === "Amount")?.Value;

  if (resultCode === 0) {
    // Payment successful — find order by AccountReference
    const accountRef = metadata.find((i: any) => i.Name === "AccountReference")?.Value;
    if (accountRef?.startsWith("OMIX-")) {
      const orderShortId = accountRef.replace("OMIX-", "");
      // Find order by short id prefix
      const { data: orders } = await supabase
        .from("orders")
        .select("id, listing_id")
        .like("id", `${orderShortId}%`)
        .eq("payment_status", "pending")
        .limit(1);

      if (orders?.[0]) {
        const matchedOrder = orders[0] as any;
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "paid",
            mpesa_receipt_number: String(mpesaReceipt),
            updated_at: new Date().toISOString(),
          })
          .eq("id", matchedOrder.id);

        // Add to order history
        await supabase.from("order_status_history").insert({
          order_id: matchedOrder.id,
          status: "paid",
          notes: `M-Pesa payment received. Receipt: ${mpesaReceipt}`,
        });

        // Mark listing as sold
        if (matchedOrder.listing_id) {
          await supabase
            .from("listings")
            .update({ status: "sold" })
            .eq("id", matchedOrder.listing_id);
        }

        revalidatePath(`/orders/${matchedOrder.id}`);
        revalidatePath("/dashboard");
      }
    }
  } else {
    // Payment failed
    await supabase
      .from("orders")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("mpesa_phone", String(phone || ""))
      .eq("payment_status", "pending");
  }
}

// =============================================
// GET ORDER DETAIL — Full order with timeline
// =============================================
export async function getOrderDetail(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "*, listings(id, title, description, price, condition, location_city, listing_images(image_url, is_primary, sort_order)), buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url, store_slug, phone), seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url, store_slug, store_name, phone, verified_badge)"
    )
    .eq("id", orderId)
    .single();

  if (error || !order) return null;

  // Verify user is participant
  if ((order as any).buyer_id !== user.id && (order as any).seller_id !== user.id) {
    return null;
  }

  // Get status history
  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  // Get delivery info
  const { data: delivery } = await supabase
    .from("delivery_logistics")
    .select("*")
    .eq("order_id", orderId)
    .single();

  return {
    ...order,
    history: history || [],
    delivery: delivery || null,
    isBuyer: (order as any).buyer_id === user.id,
  };
}

// =============================================
// UPDATE ORDER STATUS with history tracking
// =============================================
export async function updateOrderStatusWithHistory(
  orderId: string,
  status: string,
  notes?: string,
  trackingNumber?: string
) {
  const supabase = await createClient();

  // Update order
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (trackingNumber) updates.tracking_number = trackingNumber;

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return { error: error.message };

  // Add history entry
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
    notes: notes || `Status changed to ${status}`,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// =============================================
// GET USER ORDERS (purchase history)
// =============================================
export async function getUserOrders(userId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const targetId = userId || user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, listings(id, title, price, condition, listing_images(image_url, is_primary)), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name, store_slug, store_name, verified_badge)"
    )
    .or(`buyer_id.eq.${targetId},seller_id.eq.${targetId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

// =============================================
// GET SELLER EARNINGS
// =============================================
export async function getSellerEarnings(userId: string) {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("amount_cents, commission_cents, seller_earns_cents, status, created_at")
    .eq("seller_id", userId)
    .eq("status", "completed");

  const totalEarned = (orders || []).reduce((s: number, o: any) => s + o.seller_earns_cents, 0);
  const totalRevenue = (orders || []).reduce((s: number, o: any) => s + o.amount_cents, 0);
  const totalCommission = (orders || []).reduce((s: number, o: any) => s + o.commission_cents, 0);

  // Monthly breakdown
  const monthly: Record<string, number> = {};
  (orders || []).forEach((o: any) => {
    const month = o.created_at?.slice(0, 7) || "unknown";
    monthly[month] = (monthly[month] || 0) + o.seller_earns_cents;
  });

  return { totalEarned, totalRevenue, totalCommission, orderCount: orders?.length || 0, monthly };
}
