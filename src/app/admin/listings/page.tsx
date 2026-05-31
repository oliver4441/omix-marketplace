export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AdminListingsClient from "./AdminListingsClient";

export default async function AdminListingsPage() {
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

  // Show reported listings first, then all active
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, location_city, status, profiles(full_name), listing_images(image_url)")
    .in("status", ["reported", "active", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(50);

  return <AdminListingsClient listings={listings ?? []} />;
}
