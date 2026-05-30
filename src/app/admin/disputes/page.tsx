import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminDisputesClient from "./AdminDisputesClient";

export default async function AdminDisputesPage() {
  const supabase = await createClient();
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

  const { data: disputes } = await supabase
    .from("disputes")
    .select("id, status, reason, resolution_notes, created_at, order_id, profiles!disputes_opened_by_fkey(full_name), orders(amount_cents, listings(title))")
    .order("created_at", { ascending: false });

  return <AdminDisputesClient disputes={disputes ?? []} />;
}
