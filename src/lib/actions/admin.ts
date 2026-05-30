"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, error: "Not authenticated" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin)
    return { supabase, user: null, error: "Not authorized" as const };

  return { supabase, user, error: null };
}

/* ------------------------------------------------------------------ */
/*  Dashboard / Stats                                                   */
/* ------------------------------------------------------------------ */

export interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingListings: number;
  unverifiedUsers: number;
  openDisputes: number;
  totalRevenueCents: number;
  orders: {
    pending: number;
    processing: number;
    shipped: number;
    completed: number;
    disputed: number;
    cancelled: number;
    refunded: number;
  };
}

export async function getAdminStats(): Promise<AdminStats | { error: string }> {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const supabase = ctx.supabase;

  // Run independent counts in parallel
  const [
    { count: totalUsers },
    { count: activeListings },
    { count: pendingListings },
    { count: unverifiedUsers },
    { count: openDisputes },
    { data: revenueData },
    { data: ordersPending },
    { data: ordersProcessing },
    { data: ordersShipped },
    { data: ordersCompleted },
    { data: ordersDisputed },
    { data: ordersCancelled },
    { data: ordersRefunded },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified_badge", false),
    supabase.from("disputes").select("*", { count: "exact", head: true }).in("status", ["open", "under_review"]),
    supabase.from("orders").select("commission_cents").eq("status", "completed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "processing"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "shipped"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "disputed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "refunded"),
  ]);

  const totalRevenueCents = (revenueData ?? []).reduce(
    (sum: number, row: { commission_cents: number | null }) => sum + (row.commission_cents ?? 0),
    0
  );

  return {
    totalUsers: totalUsers ?? 0,
    activeListings: activeListings ?? 0,
    pendingListings: pendingListings ?? 0,
    unverifiedUsers: unverifiedUsers ?? 0,
    openDisputes: openDisputes ?? 0,
    totalRevenueCents,
    orders: {
      pending: ordersPending?.length ?? ordersPending ?? 0,
      processing: ordersProcessing?.length ?? ordersProcessing ?? 0,
      shipped: ordersShipped?.length ?? ordersShipped ?? 0,
      completed: ordersCompleted?.length ?? ordersCompleted ?? 0,
      disputed: ordersDisputed?.length ?? ordersDisputed ?? 0,
      cancelled: ordersCancelled?.length ?? ordersCancelled ?? 0,
      refunded: ordersRefunded?.length ?? ordersRefunded ?? 0,
    },
  } as AdminStats;
}

/* ------------------------------------------------------------------ */
/*  Listing Moderation                                                  */
/* ------------------------------------------------------------------ */

export async function approveListing(listingId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("listings")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) return { error: error.message };

  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function rejectListing(listingId: string, reason: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("listings")
    .update({
      status: "rejected",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) return { error: error.message };

  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function featureListing(listingId: string, featured: boolean) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("listings")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) return { error: error.message };

  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/");
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Order Management                                                    */
/* ------------------------------------------------------------------ */

export async function updateOrderStatus(
  orderId: string,
  status: string,
  tracking?: string
) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (tracking !== undefined) {
    updatePayload.tracking_number = tracking;
  }

  const { error } = await ctx.supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Seller Verification                                                 */
/* ------------------------------------------------------------------ */

export async function verifySeller(userId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ verified_badge: true })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  revalidatePath(`/profile/${userId}`);
  return { success: true };
}

export async function approveVerification(verificationId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  // Fetch the verification record to know what was verified
  const { data: verification, error: fetchError } = await ctx.supabase
    .from("trust_verification")
    .select("user_id, verification_type")
    .eq("id", verificationId)
    .single();

  if (fetchError) return { error: fetchError.message };
  if (!verification) return { error: "Verification record not found" };

  // Update the verification status
  const { error: updateError } = await ctx.supabase
    .from("trust_verification")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", verificationId);

  if (updateError) return { error: updateError.message };

  // Build profile updates based on verification type
  const profileUpdates: Record<string, boolean> = {};
  if (verification.verification_type === "phone") {
    profileUpdates.phone_verified = true;
  } else if (verification.verification_type === "id") {
    profileUpdates.id_verified = true;
  }

  // Update profile if there are fields to update
  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await ctx.supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", verification.user_id);

    if (profileError) return { error: profileError.message };

    revalidatePath(`/profile/${verification.user_id}`);
  }

  revalidatePath("/admin/verifications");
  return { success: true };
}

export async function rejectVerification(verificationId: string, notes: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("trust_verification")
    .update({
      status: "rejected",
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId);

  if (error) return { error: error.message };

  revalidatePath("/admin/verifications");
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Dispute Resolution                                                  */
/* ------------------------------------------------------------------ */

export async function resolveDispute(
  disputeId: string,
  resolution: string,
  updateOrderStatusTo?: string
) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  // Fetch the dispute to get the related order_id
  const { data: dispute, error: fetchError } = await ctx.supabase
    .from("disputes")
    .select("order_id")
    .eq("id", disputeId)
    .single();

  if (fetchError) return { error: fetchError.message };

  // Update the dispute
  const { error: updateError } = await ctx.supabase
    .from("disputes")
    .update({
      status: "resolved",
      resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  if (updateError) return { error: updateError.message };

  // Optionally update the order status
  if (updateOrderStatusTo && dispute?.order_id) {
    const { error: orderError } = await ctx.supabase
      .from("orders")
      .update({ status: updateOrderStatusTo, updated_at: new Date().toISOString() })
      .eq("id", dispute.order_id);

    if (orderError) return { error: orderError.message };

    revalidatePath(`/orders/${dispute.order_id}`);
  }

  revalidatePath("/admin/disputes");
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Reports                                                             */
/* ------------------------------------------------------------------ */

export interface ReportInfo {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reporter: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
  reported: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}

export async function getReports(): Promise<ReportInfo[] | { error: string }> {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      description,
      status,
      admin_notes,
      created_at,
      reporter:profiles!reports_reporter_id_fkey (id, display_name),
      reported_user:profiles!reports_reported_user_id_fkey (id, display_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  // Map to a clean shape
  const reports: ReportInfo[] = (data ?? []).map((r: any) => ({
    id: r.id,
    reason: r.reason,
    description: r.description,
    status: r.status,
    admin_notes: r.admin_notes,
    created_at: r.created_at,
    reporter: {
      id: r?.reporter?.id ?? "",
      display_name: r?.reporter?.display_name ?? null,
      email: null,
    },
    reported: {
      id: r?.reported_user?.id ?? "",
      display_name: r?.reported_user?.display_name ?? null,
      email: null,
    },
  }));

  return reports;
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  adminNotes?: string
) {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes !== undefined) {
    updatePayload.admin_notes = adminNotes;
  }

  const { error } = await ctx.supabase
    .from("reports")
    .update(updatePayload)
    .eq("id", reportId);

  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                           */
/* ------------------------------------------------------------------ */

export interface DailyAnalytics {
  date: string;
  new_users: number;
  new_listings: number;
  orders_placed: number;
  revenue_cents: number;
  disputes_opened: number;
}

export async function getAnalytics(): Promise<DailyAnalytics[] | { error: string }> {
  const ctx = await requireAdmin();
  if (!ctx.user) return { error: ctx.error };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data, error } = await ctx.supabase
    .from("analytics_daily")
    .select("*")
    .gte("date", fromDate)
    .order("date", { ascending: true });

  if (error) return { error: error.message };

  return (data ?? []) as DailyAnalytics[];
}
