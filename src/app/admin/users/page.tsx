export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
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

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, rating_avg, rating_count, verified_badge, created_at")
    .order("created_at", { ascending: false });

  return <AdminUsersClient users={users ?? []} />;
}
