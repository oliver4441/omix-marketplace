"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatPrice,
  CONDITIONS,
  CATEGORIES,
  TILL_NUMBER,
  DELIVERY_ZONES,
} from "@/lib/constants";
import { createOrder } from "@/lib/actions/orders";
import { getOrCreateConversation, sendMessage } from "@/lib/actions/messages";
import { createClient } from "@/utils/supabase/client";

interface ListingDetailProps {
  listing: any;
  seller: any;
  images: any[];
  category: any;
  conditionLabel: string;
  isOwner: boolean;
  user: { id: string } | null;
}

export default function ListingDetailClient({
  listing,
  seller,
  images,
  category,
  conditionLabel,
  isOwner,
  user,
}: ListingDetailProps) {
  const router = useRouter();
  const [msgText, setMsgText] = useState("");
  const [buying, setBuying] = useState(false);
  const [chatting, setChatting] = useState(false);

  async function handleBuy() {
    if (!user) return;
    setBuying(true);
    const result = await createOrder(listing.id, user.id);
    if (result.error) {
      alert(result.error);
    } else {
      router.push("/dashboard");
    }
    setBuying(false);
  }

  async function handleChat() {
    if (!user || !seller) return;
    setChatting(true);
    try {
      const conversationId = await getOrCreateConversation(
        user.id,
        seller.id,
        listing.id
      );
      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || "Failed to start conversation");
    }
    setChatting(false);
  }

  async function handleSendMessage() {
    if (!user || !seller || !msgText.trim()) return;
    try {
      const conversationId = await getOrCreateConversation(
        user.id,
        seller.id,
        listing.id
      );
      await sendMessage(conversationId, user.id, msgText.trim());
      setMsgText("");
      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          {images[0]?.image_url ? (
            <img
              src={images[0].image_url}
              alt={listing.title}
              className="w-full aspect-square object-cover rounded-xl"
            />
          ) : (
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl">
              📦
            </div>
          )}
          {images.length > 1 && (
            <div className="flex gap-2 mt-2">
              {images.map((img: any) => (
                <div
                  key={img.id}
                  className="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-600"
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <span className="bg-gray-100 text-xs font-medium px-2 py-1 rounded-full">
              {conditionLabel}
            </span>
            {category && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                {category.name}
              </span>
            )}
            {listing.is_negotiable && (
              <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                Negotiable
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-3xl font-bold text-emerald-700">
            {formatPrice(listing.price)}
          </p>
          {listing.description && (
            <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
          )}

          {/* Seller Info */}
          <div className="bg-white p-4 rounded-xl border space-y-2">
            <p className="text-sm">
              <strong>Location:</strong> {listing.location_city}
              {listing.location_region ? `, ${listing.location_region}` : ""}
            </p>
            <p className="text-sm">
              <strong>Seller:</strong>{" "}
              {seller?.store_slug ? (
                <Link href={`/sellers/${seller.store_slug}`} className="text-emerald-600 hover:underline">
                  {seller?.store_name || seller?.full_name ?? "—"}
                </Link>
              ) : (
                <Link href={`/profiles/${seller?.id}`} className="text-emerald-600 hover:underline">
                  {seller?.full_name ?? "—"}
                </Link>
              )}
              {seller?.verified_badge && (
                <span className="ml-1 text-emerald-600">✓</span>
              )}
            </p>
            {seller?.rating_count > 0 && (
              <p className="text-sm">
                <strong>Rating:</strong> ⭐ {seller.rating_avg} ({seller.rating_count} reviews)
              </p>
            )}
            {seller?.store_slug && (
              <p className="text-sm">
                <Link href={`/sellers/${seller.store_slug}`} className="text-emerald-600 hover:underline">
                  🏪 Visit Store
                </Link>
              </p>
            )}
            <p className="text-sm text-gray-400">
              {listing.views} views · Listed{" "}
              {new Date(listing.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex gap-2">
              <Link
                href={`/sell?edit=${listing.id}`}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium hover:bg-gray-50"
              >
                Edit Listing
              </Link>
            </div>
          )}

          {/* Buyer actions */}
          {!isOwner && user && (
            <div className="space-y-2">
              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {buying ? "Processing..." : "Buy Now"}
              </button>
              <button
                onClick={handleChat}
                disabled={chatting}
                className="w-full py-3 border border-emerald-600 text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition disabled:opacity-50"
              >
                💬 Chat with Seller
              </button>
            </div>
          )}

          {/* Quick message to seller */}
          {!isOwner && user && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick message</p>
              <div className="flex gap-2">
                <input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Ask the seller a question..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {!user && (
            <Link
              href={`/auth/login?callbackUrl=/listings/${listing.id}`}
              className="block w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-center"
            >
              Sign In to Buy or Message
            </Link>
          )}

          {/* How to Buy */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-amber-800">How to Buy</p>
            <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
              <li>Click &quot;Buy Now&quot; to start the order</li>
              <li>Pay via M-Pesa to <strong>Till {TILL_NUMBER}</strong></li>
              <li>Share your receipt with the seller</li>
              <li>Omix holds payment until you confirm delivery</li>
              <li>Rate the seller after completion</li>
            </ol>
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-sm font-medium text-gray-700">Delivery Fees (Kericho)</p>
              {DELIVERY_ZONES.map((z) => (
                <p key={z.id} className="text-sm text-gray-600">
                  {z.name}: KES {z.fee}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
