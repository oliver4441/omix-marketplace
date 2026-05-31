"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addToCart(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first" };

  const { data: listing } = await supabase.from("listings").select("id, status").eq("id", listingId).single();
  if (!listing || listing.status !== "active") return { error: "Listing is not available" };

  const { error } = await supabase.from("cart_items").upsert(
    { user_id: user.id, listing_id: listingId },
    { onConflict: "user_id,listing_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCart(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("cart_items").delete().eq("user_id", user.id).eq("listing_id", listingId);
  revalidatePath("/cart");
}

export async function clearCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("cart_items").delete().eq("user_id", user.id);
  revalidatePath("/cart");
}

export async function getCartItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0 };

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "id, listing_id, quantity, listings(id, title, price, condition, location_city, status, listing_images(image_url, is_primary, sort_order), profiles!listings_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge))"
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: true });

  if (error) return { items: [], total: 0 };

  const items = (data || [])
    .map((item: any) => {
      const l = item.listings;
      if (!l) return null;
      const images = (l.listing_images || [])
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((img: any) => img.image_url);
      return {
        cart_id: item.id, listing_id: l.id, title: l.title, price: l.price,
        condition: l.condition, location: l.location_city, status: l.status,
        images: images.length > 0 ? images : null,
        seller_name: l.profiles?.store_name || l.profiles?.full_name || "Seller",
        seller_slug: l.profiles?.store_slug, quantity: item.quantity,
      };
    })
    .filter(Boolean);

  const total = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  return { items, total };
}

export async function getCartCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  return count ?? 0;
}
