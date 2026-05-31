"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/constants";
import StarRating from "@/components/StarRating";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  images: string[] | null;
  isNegotiable?: boolean;
  isFeatured?: boolean;
  viewCount?: number;
  createdAt?: string;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerStoreSlug?: string;
  sellerRating?: number;
}

const conditionColors: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700",
  "like_new": "bg-blue-100 text-blue-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-orange-100 text-orange-700",
};

function conditionLabel(val: string): string {
  if (val === "like_new") return "Like New";
  if (val === "good") return "Good";
  if (val === "fair") return "Fair";
  if (val === "poor") return "Poor";
  return val;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

export default function ProductCard({
  id,
  title,
  price,
  condition,
  location,
  images,
  isNegotiable = false,
  isFeatured = false,
  viewCount,
  createdAt,
  sellerName,
  sellerVerified = false,
  sellerStoreSlug,
  sellerRating,
}: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imageUrl = images && images.length > 0 ? images[0] : null;

  const timeAgo = createdAt ? getRelativeTime(createdAt) : null;

  return (
    <Link href={`/listings/${id}`}>
      <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer h-full group">
        {/* Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {imageUrl && !imgError ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              )}
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl">📦</span>
              <span className="text-xs mt-1">No photo</span>
            </div>
          )}

          {/* Featured badge */}
          {isFeatured && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              ⭐ Featured
            </span>
          )}

          {/* Condition badge */}
          <span
            className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              conditionColors[condition] || "bg-gray-100 text-gray-600"
            }`}
          >
            {conditionLabel(condition)}
          </span>

          {/* Image count indicator */}
          {images && images.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              📷 {images.length}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-700 transition-colors">
            {title}
          </h3>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            {formatPrice(price)}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {isNegotiable && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                Negotiable
              </span>
            )}
            <span className="text-[11px] text-gray-400 truncate">{location}</span>
          </div>

          {/* Seller info */}
          {sellerName && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold shrink-0">
                {sellerName[0]?.toUpperCase()}
              </div>
              <span className="text-[11px] text-gray-500 truncate">
                {sellerName}
              </span>
              {sellerVerified && (
                <span className="text-[10px] text-emerald-600" title="Verified seller">✓</span>
              )}
              {sellerRating !== undefined && sellerRating > 0 && (
                <StarRating rating={sellerRating} size="xs" />
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
            {viewCount !== undefined && <span>👁️ {viewCount}</span>}
            {timeAgo && <span>{timeAgo}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
