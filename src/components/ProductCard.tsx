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

const conditionStyles: Record<string, string> = {
  new: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  like_new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  good: "bg-green-500/20 text-green-400 border-green-500/30",
  fair: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  poor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function conditionLabel(val: string): string {
  if (val === "like_new") return "Like New";
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

export default function ProductCard(props: ProductCardProps) {
  const { id, title, price, condition, location, images, isNegotiable, isFeatured, viewCount, createdAt, sellerName, sellerVerified, sellerStoreSlug, sellerRating } = props;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imageUrl = images && images.length > 0 ? images[0] : null;
  const timeAgo = createdAt ? getRelativeTime(createdAt) : null;

  return (
    <Link href={`/listings/${id}`} className="product-tile block h-full">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        {imageUrl && !imgError ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />}
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">No photo</span>
          </div>
        )}

        {isFeatured && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.9)", color: "#fff" }}>
            Featured
          </span>
        )}

        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conditionStyles[condition] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
          {conditionLabel(condition)}
        </span>

        {images && images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            {images.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] text-gray-200 group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>
        <p className="text-lg font-bold text-emerald-400 mt-1">
          {formatPrice(price)}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {isNegotiable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
              Negotiable
            </span>
          )}
          <span className="text-[11px] text-gray-500 truncate">{location}</span>
        </div>
      </div>
    </Link>
  );
}
