export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AdminOrdersClient from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, amount_cents, listings(title), profiles!orders_buyer_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  return <AdminOrdersClient orders={orders ?? []} />;
}
