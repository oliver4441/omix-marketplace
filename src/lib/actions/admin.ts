"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Not authenticated" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { supabase, user: null, error: "Not authorized" as const };
  return { supabase, user, error: null };
}

export async function approveListing(productId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await ctx.supabase
    .from("products")
    .update({ status: "active" })
    .eq("id", productId);
  revalidatePath("/admin/listings");
}

export async function rejectListing(productId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await ctx.supabase
    .from("products")
    .update({ status: "rejected" })
    .eq("id", productId);
  revalidatePath("/admin/listings");
}

export async function confirmPayment(orderId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await ctx.supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId);
  revalidatePath("/admin/orders");
}

export async function updateOrderStatus(orderId: string, status: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await ctx.supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  revalidatePath("/admin/orders");
}

export async function verifySeller(userId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await ctx.supabase
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", userId);
  revalidatePath("/admin/users");
}
