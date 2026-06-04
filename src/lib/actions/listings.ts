"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getListings({
  search,
  category,
  limit = 40,
  offset = 0,
}: {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("getListings error:", error);
      // Return empty rather than crash
      return { listings: [], count: 0 };
    }

    return { listings: data || [], count: count ?? 0 };
  } catch (e) {
    console.error("getListings exception:", e);
    return { listings: [], count: 0 };
  }
}

export async function getListing(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createListing(formData: FormData) {
  try {
    const supabase = await createClient();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseInt(formData.get("price") as string);
    const condition = formData.get("condition") as string;
    const category = formData.get("category") as string;
    const location = formData.get("location") as string;
    const image_url = formData.get("image_url") as string;
    const seller_name = formData.get("seller_name") as string;
    const seller_phone = formData.get("seller_phone") as string;

    const { data, error } = await supabase
      .from("listings")
      .insert({
        title,
        description,
        price,
        condition,
        category,
        location,
        images: image_url ? [image_url] : [],
        seller_name,
        seller_phone: seller_phone || null,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("createListing error:", error);
      return { success: false, error: "Failed to create listing" };
    }

    revalidatePath("/");
    return { success: true, id: data?.id };
  } catch (e) {
    console.error("createListing exception:", e);
    return { success: false, error: "Something went wrong" };
  }
}
