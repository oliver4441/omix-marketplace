"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// =============================================
// TRIGGER NOTIFICATION — Insert into notifications table
// Called from other actions (orders, messages, reviews)
// The client-side Realtime subscription picks it up
// =============================================

interface NotifyParams {
  userId: string;          // recipient
  type: "order_update" | "new_message" | "review" | "sale" | "system" | "listing_approved";
  title: string;
  content: string;
  data?: Record<string, unknown>;  // JSON payload
}

export async function createNotification(params: NotifyParams) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    content: params.content,
    data: params.data || null,
    is_read: false,
  });

  if (error) {
    console.error("Notification error:", error);
    return { error: error.message };
  }

  return { success: true };
}

// =============================================
// MARK NOTIFICATION AS READ
// =============================================
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { success: true };
}

// =============================================
// MARK ALL AS READ
// =============================================
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/notifications");
  return { success: true };
}

// =============================================
// GET USER NOTIFICATIONS (paginated)
// =============================================
export async function getNotifications(limit = 20, offset = 0) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notifications: [], count: 0 };

  const { data, error, count } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { notifications: [], count: 0 };
  return { notifications: data || [], count: count ?? 0 };
}

// =============================================
// GET UNREAD NOTIFICATION COUNT
// =============================================
export async function getUnreadCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { count: 0 };

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return { count: count ?? 0 };
}
