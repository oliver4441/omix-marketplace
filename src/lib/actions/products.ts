"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/constants";

// =============================================
// GET LISTINGS — Search active listings with filters
// =============================================
export async function getListings({
  search,
  categorySlug,
  city,
  minPrice,
  maxPrice,
  limit = 20,
  offset = 0,
}: {
  search?: string;
  categorySlug?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      "*, profiles!listings_seller_id_fkey(id, full_name, avatar_url, store_slug, verified_badge, rating_avg, rating_count), listing_images(*)",
      { count: "exact" }
    )
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (categorySlug) {
    const category = getCategoryBySlug(categorySlug);
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  if (city) {
    query = query.ilike("location_city", `%${city}%`);
  }

  if (minPrice !== undefined) {
    query = query.gte("price", Math.round(minPrice * 100));
  }

  if (maxPrice !== undefined) {
    query = query.lte("price", Math.round(maxPrice * 100));
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("getListings error:", error);
    return { listings: [], count: 0 };
  }

  // Sort images to put primary first
  const listings = (data || []).map((listing: any) => ({
    ...listing,
    listing_images: (listing.listing_images || []).sort(
      (a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
    ),
  }));

  return { listings, count: count ?? 0 };
}

// =============================================
// GET LISTING — Single listing with seller, images, reviews
// =============================================
export async function getListing(id: string) {
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "*, profiles!listings_seller_id_fkey(*), listing_images(*), reviews(*, profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url))"
    )
    .eq("id", id)
    .single();

  if (error || !listing) {
    console.error("getListing error:", error);
    return null;
  }

  // Sort images: primary first
  const images = (listing.listing_images || []).sort(
    (a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  );

  return { ...listing, listing_images: images };
}

// =============================================
// GET SELLER LISTINGS — All listings by a seller (any status)
// =============================================
export async function getSellerListings(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSellerListings error:", error);
    return [];
  }

  return data || [];
}

// =============================================
// CREATE LISTING — Insert with status 'pending_review'
// =============================================
export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const condition = formData.get("condition") as string;
  const location = formData.get("location") as string;
  const categoryId = parseInt(formData.get("category_id") as string);
  const isNegotiable = formData.get("is_negotiable") === "on";

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      title,
      description,
      price,
      condition,
      location_city: location,
      location_region: "Kericho",
      category_id: isNaN(categoryId) ? null : categoryId,
      is_negotiable: isNegotiable,
      status: "pending_review",
      seller_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create listing error:", error);
    redirect("/sell?error=Failed+to+create+listing");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// =============================================
// UPDATE LISTING — Update if seller owns it
// =============================================
export async function updateListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const listingId = formData.get("listing_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const condition = formData.get("condition") as string;
  const location = formData.get("location") as string;
  const categoryId = parseInt(formData.get("category_id") as string);
  const isNegotiable = formData.get("is_negotiable") === "on";

  await supabase
    .from("listings")
    .update({
      title,
      description,
      price,
      condition,
      location_city: location,
      category_id: isNaN(categoryId) ? null : categoryId,
      is_negotiable: isNegotiable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);
}

// =============================================
// DELETE LISTING — Delete if owner
// =============================================
export async function deleteListing(listingId: string, sellerId: string) {
  const supabase = await createClient();

  await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("seller_id", sellerId);

  revalidatePath("/dashboard");
}

// =============================================
// MARK AS SOLD — Set status to 'sold'
// =============================================
export async function markAsSold(listingId: string, sellerId: string) {
  const supabase = await createClient();

  await supabase
    .from("listings")
    .update({ status: "sold", updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", sellerId);

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);
}

// =============================================
// TOGGLE FAVORITE — Add/remove from user_favorites
// =============================================
export async function toggleFavorite(userId: string, listingId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_favorites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
    return { favorited: false };
  } else {
    await supabase.from("user_favorites").insert({
      user_id: userId,
      listing_id: listingId,
    });
    return { favorited: true };
  }
}

// =============================================
// INCREMENT VIEWS — Increment views count
// =============================================
export async function incrementViews(listingId: string) {
  const supabase = await createClient();

  // Use RPC for atomic increment, or fallback to manual
  const { data: listing } = await supabase
    .from("listings")
    .select("views")
    .eq("id", listingId)
    .single();

  if (listing) {
    await supabase
      .from("listings")
      .update({ views: (listing.views || 0) + 1 })
      .eq("id", listingId);
  }
}

// =============================================
// GET SELLER PROFILE — By store_slug with listings count and avg rating
// =============================================
export async function getSellerProfile(storeSlug: string) {
  const supabase = await createClient();

  // Get profile by store_slug
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("store_slug", storeSlug)
    .single();

  if (profileError || !profile) {
    console.error("getSellerProfile error:", profileError);
    return null;
  }

  // Count listings
  const { count: listingsCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", profile.id);

  // Get average rating from reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", profile.id);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : null;

  return {
    ...profile,
    listings_count: listingsCount ?? 0,
    avg_rating: avgRating,
    reviews_count: reviews?.length ?? 0,
  };
}
