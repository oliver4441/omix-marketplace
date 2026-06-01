"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/constants";

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
    <Link href={`/listings/${id}`} className="product-tile group block h-full">
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden bg-white/5">
        {imageUrl && !imgError ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />}
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"} group-hover:scale-105`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.02] to-white/[0.05]">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-[10px] text-slate-600 mt-1">No photo</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${conditionStyles[condition] || "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
            {conditionLabel(condition)}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {isFeatured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white backdrop-blur-sm">
              Featured
            </span>
          )}
          {images && images.length > 1 && (
            <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              {images.length}
            </span>
          )}
        </div>

        {/* Bottom-left: time ago */}
        {timeAgo && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 px-2 py-0.5 rounded-md">
              {timeAgo}
            </span>
          </div>
        )}

        {/* Bottom-right: views */}
        {viewCount !== undefined && viewCount > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/60 backdrop-blur-sm text-[10px] text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 172.16.12.52.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {viewCount}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] text-slate-200 group-hover:text-emerald-400 transition-colors duration-200">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <p className="text-lg font-bold text-emerald-400">
            {formatPrice(price)}
          </p>
          {isNegotiable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-blue-500/10 text-blue-400 border border-blue-500/15">
              Negotiable
            </span>
          )}
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            <span className="text-[11px] text-slate-500 truncate">{location}</span>
          </div>
        )}

        {/* Seller info */}
        {sellerName && (
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-[10px] text-emerald-400 font-semibold">
              {sellerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] text-slate-500 truncate flex-1">{sellerName}</span>
            {sellerVerified && (
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
            {sellerRating !== undefined && sellerRating > 0 && (
              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {sellerRating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
