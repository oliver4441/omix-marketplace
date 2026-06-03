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
  createdAt?: string;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerStoreSlug?: string | null;
  sellerRating?: number;
}

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
  const { id, title, price, condition, location, images, isNegotiable, createdAt, sellerName, sellerVerified, sellerRating } = props;
  const [imgError, setImgError] = useState(false);
  const imageUrl = images && images.length > 0 ? images[0] : null;
  const timeAgo = createdAt ? getRelativeTime(createdAt) : null;

  return (
    <Link href={`/listings/${id}`} className="airbnb-card group block h-full">
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-[14px]" style={{ background: "var(--bg-secondary)" }}>
        {imageUrl && !imgError ? (
          <Image src={imageUrl} alt={title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-8 h-8" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>No photo</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
            {conditionLabel(condition)}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <svg className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
        </div>

        {timeAgo && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-[10px] text-[var(--text-primary)] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)" }}>
              {timeAgo}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-[13px] leading-snug line-clamp-2 min-h-[2rem]" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>

        <div className="flex items-baseline gap-2 pt-0.5">
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{formatPrice(price)}</p>
          {isNegotiable && <span className="text-[10px] font-medium text-[#ff385c]">Negotiable</span>}
        </div>

        {location && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{location}</span>
          </div>
        )}

        {sellerName && (
          <div className="flex items-center gap-2 pt-1.5 border-t mt-1.5" style={{ borderColor: "var(--border-light)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
              {sellerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] truncate flex-1" style={{ color: "var(--text-muted)" }}>{sellerName}</span>
            {sellerVerified && (
              <svg className="w-3.5 h-3.5 shrink-0 text-[#ff385c]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
            {sellerRating !== undefined && sellerRating > 0 && (
              <span className="text-[10px] flex items-center gap-0.5 shrink-0" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-3 h-3 text-[#ff385c]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {sellerRating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
