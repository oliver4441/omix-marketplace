"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import StarRating, { RatingDistribution } from "@/components/StarRating";

interface StoreProfile {
  id: string;
  full_name: string;
  store_name: string;
  store_description: string;
  avatar_url: string | null;
  location_city: string;
  seller_bio: string;
  rating_avg: number;
  rating_count: number;
  verified_badge: boolean;
  created_at: string;
  is_admin: boolean;
}

interface StoreListing {
  id: string;
  title: string;
  price: number;
  condition: string;
  status: string;
  images: { image_url: string; is_primary: boolean }[];
}

interface StoreReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { full_name: string; avatar_url: string | null };
}

export default function SellerStorePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [tab, setTab] = useState<"listings" | "reviews" | "about">("listings");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStore = useCallback(async () => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_slug", slug)
      .single();

    if (!prof) {
      setLoading(false);
      return;
    }
    setProfile(prof as StoreProfile);

    const [listingsRes, reviewsRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, title, price, condition, status, listing_images(image_url, is_primary)")
        .eq("seller_id", prof.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
        .eq("reviewee_id", prof.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setListings((listingsRes.data as any[]) || []);
    setReviews((reviewsRes.data as any[]) || []);
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => {
    fetchStore();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, [fetchStore, supabase]);

  async function handleMessage() {
    if (!userId || !profile) {
      router.push("/auth/login");
      return;
    }

    // Check for existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id, conversation_members!inner(user_id)")
      .eq("conversation_members.user_id", userId)
      .single();

    if (existing) {
      router.push(`/messages`);
      return;
    }

    // Create new conversation
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ listing_id: null, order_id: null })
      .select("id")
      .single();

    if (conv) {
      await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: profile.id },
      ]);
      router.push(`/messages`);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-400">Loading store...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-5xl mb-4">🏪</p>
        <p className="text-lg font-medium text-white">Store not found</p>
        <Link href="/" className="text-emerald-400 hover:underline text-sm">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Store Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl text-emerald-400 font-bold shrink-0">
            {profile.store_name?.[0] || profile.full_name?.[0] || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{profile.store_name || profile.full_name}&apos;s Store</h1>
              {profile.verified_badge && (
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  ✓ Verified
                </span>
              )}
            </div>
            {profile.store_description && (
              <p className="text-slate-300 text-sm mt-1">{profile.store_description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              {profile.location_city && <span>Location: {profile.location_city}</span>}
              {profile.rating_count > 0 && (
                <span>Rating: {profile.rating_avg.toFixed(1)} ({profile.rating_count} reviews)</span>
              )}
              <span>
                Member since {new Date(profile.created_at).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          {userId !== profile.id && (
            <button
              onClick={handleMessage}
              className="px-4 py-2 glass-btn rounded-xl text-sm font-medium shrink-0"
            >
              💬 Message
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {reviews.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Rating Breakdown</h3>
            <RatingDistribution
              ratings={[5, 4, 3, 2, 1].map((stars) => ({
                stars,
                count: reviews.filter((r) => r.rating === stars).length,
              }))}
              total={reviews.length}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{listings.length}</p>
            <p className="text-xs text-slate-400">Active Listings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{reviews.length}</p>
            <p className="text-xs text-slate-400">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{profile.rating_avg.toFixed(1)}</p>
            <p className="text-xs text-slate-400">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/10 rounded-xl p-1">
        {(["listings", "reviews", "about"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {t === "listings" ? `Listings (${listings.length})` : t === "reviews" ? `Reviews (${reviews.length})` : "About"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "listings" && (
        <>
          {listings.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="glass-card overflow-hidden hover:border-emerald-500/30 transition-colors cursor-pointer h-full">
                    <div className="aspect-square bg-white/5 relative">
                      {listing.images?.length > 0 ? (
                        <img
                          src={listing.images.find((i) => i.is_primary)?.image_url || listing.images[0].image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">No image</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-white line-clamp-2">{listing.title}</h3>
                      <p className="text-lg font-bold text-emerald-400 mt-1">{formatPrice(listing.price)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">No image</p>
              <p className="text-slate-300">No active listings yet</p>
            </div>
          )}
        </>
      )}

      {tab === "reviews" && (
        <>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                      {review.reviewer?.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{review.reviewer?.full_name || "Anonymous"}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(review.created_at).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-slate-300">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">⭐</p>
              <p className="text-slate-300">No reviews yet</p>
            </div>
          )}
        </>
      )}

      {tab === "about" && (
        <div className="glass-card p-6">
          <h3 className="font-bold mb-3 text-white">About {profile.store_name || profile.full_name}</h3>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">
            {profile.seller_bio || "This seller hasn't written a bio yet."}
          </p>
          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Location:</span>
              <span className="ml-2 font-medium text-white">{profile.location_city || "Kenya"}</span>
            </div>
            <div>
              <span className="text-slate-400">Member since:</span>
              <span className="ml-2 font-medium text-white">
                {new Date(profile.created_at).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Verification:</span>
              <span className={`ml-2 font-medium ${profile.verified_badge ? "text-emerald-400" : "text-slate-500"}`}>
                {profile.verified_badge ? "✓ Verified Seller" : "Not verified"}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Listings:</span>
              <span className="ml-2 font-medium text-white">{listings.length} active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
