import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireAdmin() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  return profile;
}

export async function requireSeller() {
  const profile = await getUserProfile();
  if (!profile || (profile.role !== "seller" && profile.role !== "admin"))
    redirect("/");
  return profile;
}
