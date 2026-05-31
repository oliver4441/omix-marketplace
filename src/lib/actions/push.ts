"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// =============================================
// SAVE PUSH SUBSCRIPTION
// =============================================
// Called from client when user grants notification permission
// Stores the subscription endpoint + keys in the browser_notifications table
// =============================================

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    console.error("Save subscription error:", error);
    return { error: error.message };
  }

  return { success: true };
}

// =============================================
// REMOVE PUSH SUBSCRIPTION
// =============================================
export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return { success: true };
}

// =============================================
// GET PUSH PUBLIC KEY — for client subscription
// =============================================
export async function getVapidPublicKey() {
  return { publicKey: VAPID_PUBLIC_KEY };
}
