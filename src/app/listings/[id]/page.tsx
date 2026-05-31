"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { formatPrice, CONDITIONS, CATEGORIES } from "@/lib/constants";
import { addToCart } from "@/lib/actions/cart";

interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  is_negotiable: boolean;
  location_city: string;
  views: number;
  status: string;
  created_at: string;
  seller_id: string;
  category_id: number;
  images: { id: string; image_url: string; is_primary: boolean }[];
  seller: {
    id: string;
    full_name: string;
    store_name: string | null;
    store_slug: string | null;
    avatar_url: string | null;
    seller_bio: string | null;
    rating_avg: number;
    rating_count: number;
    verified_badge: boolean;
    location_city: string;
    phone: string | null;
  };
  reviews: { id: string; rating: number; comment: string; created_at: string; reviewer: { full_name: string } }[];
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSending, setOfferSending] = useState(false);

  const fetchListing = useCallback(async () => {
    const { data } = await supabase
      .from("listings")
      .select(
        "*, listing_images(id, image_url, is_primary), seller:profiles!listings_seller_id_fkey(id, full_name, phone, store_name, store_slug, avatar_url, seller_bio, rating_avg, rating_count, verified_badge, location_city)"
      )
      .eq("id", id)
      .single();

    if (data) {
      const l = data as any;
      setListing({
        ...l,
        seller: l.seller || {},
        images: (l.listing_images || []).sort(
          (a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
        ),
        reviews: [],
      });

      // Increment views
      await supabase.from("listings").update({ views: (l.views || 0) + 1 }).eq("id", id);
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchListing();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user) {
        supabase
          .from("user_favorites")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", id)
          .then(({ data }) => setIsFavorited(!!data?.length));
      }
    });

    // Lightbox escape handler
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLightbox(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fetchListing, supabase, id]);

  async function handleFavorite() {
    if (!userId) {
      router.push("/auth/login");
      return;
    }
    if (isFavorited) {
      await supabase.from("user_favorites").delete().eq("user_id", userId).eq("listing_id", id);
      setIsFavorited(false);
    } else {
      await supabase.from("user_favorites").insert({ user_id: userId, listing_id: id });
      setIsFavorited(true);
    }
  }

  async function handleContactSeller() {
    if (!userId || !listing) {
      router.push("/auth/login");
      return;
    }
    if (userId === listing.seller_id) return;

    // Get or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id, conversation_members!inner(user_id)")
      .eq("listing_id", id)
      .single();

    if (existing) {
      router.push("/messages");
      return;
    }

    const { data: conv } = await supabase
      .from("conversations")
      .insert({ listing_id: id, order_id: null })
      .select("id")
      .single();

    if (conv) {
      await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: listing.seller_id },
      ]);
      router.push("/messages");
    }
  }

  async function handleSendOffer() {
    if (!userId || !listing || !offerAmount) return;
    setOfferSending(true);
    const amount = Math.round(parseFloat(offerAmount) * 100);

    const { data: conv } = await supabase
      .from("conversations")
      .insert({ listing_id: id, order_id: null })
      .select("id")
      .single();

    if (conv) {
      await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: listing.seller_id },
      ]);

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: userId,
        message_type: "offer",
        content: `Offered ${formatPrice(amount)}`,
        offer_cents: amount,
        offer_status: "pending",
      });

      router.push("/messages");
    }
    setOfferSending(false);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Listing not found</p>
      </div>
    );
  }

  const conditionLabel = CONDITIONS.find((c) => c.value === listing.condition)?.label;
  const category = CATEGORIES.find((c) => c.id === listing.category_id);
  const isOwner = userId === listing.seller_id;
  const imageUrl = listing.images?.[activeImage]?.image_url;

  const [showLightbox, setShowLightbox] = useState(false);

  const waLink = listing.seller?.phone
    ? `https://wa.me/${listing.seller.phone.replace(/^0/, "254")}?text=${encodeURIComponent(`Hi! I'm interested in your listing: ${listing.title} - ${formatPrice(listing.price)} on Omix Marketplace`)}`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Lightbox */}
      {showLightbox && imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
            onClick={() => setShowLightbox(false)}
          >
            ✕
          </button>
          <img
            src={imageUrl}
            alt={listing.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {listing.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {listing.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    i === activeImage ? "border-emerald-500" : "border-white/30"
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        {category && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/?category=${category.slug}`} className="hover:text-emerald-600">{category.name}</Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-gray-700">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Images */}
        <div className="lg:col-span-3">
          <div
            className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-3 cursor-zoom-in"
            onClick={() => imageUrl && setShowLightbox(true)}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 ${
                    i === activeImage ? "border-emerald-600" : "border-transparent"
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {conditionLabel && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">
                  {conditionLabel}
                </span>
              )}
              {listing.is_negotiable && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  Negotiable
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <p className="text-3xl font-bold text-emerald-700 mt-2">{formatPrice(listing.price)}</p>
          </div>

          {listing.description && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-medium text-sm mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwner && listing.status === "active" && (
            <div className="space-y-2">
              <button
                onClick={handleContactSeller}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                💬 Chat with Seller
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 text-center block"
                >
                  📱 WhatsApp Seller
                </a>
              )}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={async () => {
                    const result = await addToCart(id);
                    if (result?.error) {
                      alert(result.error);
                    } else {
                      router.push("/cart");
                    }
                  }}
                  className="py-2 border border-emerald-600 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-50"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => setShowOfferInput(!showOfferInput)}
                  className="py-2 border border-emerald-600 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-50"
                >
                  Make Offer
                </button>
                <button
                  onClick={handleFavorite}
                  className={`py-2 border rounded-xl text-sm font-medium ${
                    isFavorited
                      ? "border-red-200 text-red-600 bg-red-50"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isFavorited ? "Saved" : "Save"}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                    } catch (_e) {
                      // fallback — clipboard may be blocked
                    }
                  }}
                  className="py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  🔗 Share
                </button>
              </div>

              {showOfferInput && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Listed at {formatPrice(listing.price)}</p>
                  <div className="flex gap-2">
                    <input
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      type="number"
                      placeholder="Your offer (KES)"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <button
                      onClick={handleSendOffer}
                      disabled={offerSending || !offerAmount}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This will start a chat with your offer</p>
                </div>
              )}
            </div>
          )}

          {listing.status !== "active" && (
            <div className={`py-3 px-4 rounded-xl text-center font-medium ${
              listing.status === "sold" ? "bg-gray-100 text-gray-500" : "bg-yellow-50 text-yellow-700"
            }`}>
              {listing.status === "sold" ? "This item has been sold" : `Status: ${listing.status}`}
            </div>
          )}

          {/* Listing Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Condition</span>
              <span className="font-medium">{conditionLabel || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="font-medium">{listing.location_city || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium">{category?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Views</span>
              <span className="font-medium">{listing.views.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Posted</span>
              <span className="font-medium">
                {new Date(listing.created_at).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <Link href={listing.seller?.store_slug ? `/store/${listing.seller.store_slug}` : "#"}>
              <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl text-emerald-700 font-bold shrink-0">
                  {listing.seller?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm truncate">
                      {listing.seller?.store_name || listing.seller?.full_name || "Seller"}
                    </p>
                    {listing.seller?.verified_badge && (
                      <span className="text-emerald-600 text-xs">✓</span>
                    )}
                  </div>
                  {listing.seller?.rating_count > 0 && (
                    <p className="text-xs text-gray-500">
                      ⭐ {listing.seller.rating_avg.toFixed(1)} ({listing.seller.rating_count} reviews)
                    </p>
                  )}
                  {listing.seller?.location_city && (
                    <p className="text-xs text-gray-400">📍 {listing.seller.location_city}</p>
                  )}
                </div>
                <span className="text-xs text-emerald-600">View Store →</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
