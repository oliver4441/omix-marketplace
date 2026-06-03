"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import { approveListing, rejectListing } from "@/lib/actions/admin";

interface ListingRow {
  id: string;
  title: string;
  price: number;
  location_city: string;
  status: string;
  profiles: { full_name: string | null }[] | { full_name: string | null };
  listing_images: { image_url: string }[];
}

export default function AdminListingsClient({ listings }: { listings: ListingRow[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Manage Listings</h1>
      {listings && listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((l) => (
            <ListingItem key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No listings need review</p>
        </div>
      )}
    </div>
  );
}

function ListingItem({ listing }: { listing: ListingRow }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove() {
    const result = await approveListing(listing.id);
    if ("error" in result && result.error) alert(result.error);
    window.location.reload();
  }

  async function handleReject() {
    const reason = rejecting && rejectReason ? rejectReason : "Archived by admin";
    if (rejecting && !reason.trim()) { alert("Please provide a rejection reason"); return; }
    const result = await rejectListing(listing.id, reason);
    if ("error" in result && result.error) alert(result.error);
    window.location.reload();
  }

  return (
    <div className={`glass-card p-4 flex items-center gap-4 ${listing.status === "reported" ? "border-red-500/30" : ""}`}>
      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
        {listing.listing_images?.[0]?.image_url ? (
          <img src={listing.listing_images[0].image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[var(--text-primary)]">{listing.title}</h3>
          {listing.status === "reported" && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">Reported</span>
          )}
        </div>
        <p className="text-sm text-slate-400">
          by {(Array.isArray(listing.profiles) ? listing.profiles[0]?.full_name : listing.profiles?.full_name) || "Unknown"} &middot; {listing.location_city}
        </p>
        <p className="text-emerald-400 font-semibold">{formatPrice(listing.price)}</p>
        {rejecting && (
          <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason (optional)" className="glass-input mt-2 text-sm" />
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={handleApprove} className="glass-btn text-xs py-1.5 px-3">Approve</button>
        {rejecting ? (
          <>
            <button onClick={handleReject} className="glass-btn-outline text-xs py-1.5 px-3 text-red-400 border-red-500/30">Confirm</button>
            <button onClick={() => setRejecting(false)} className="glass-btn-outline text-xs py-1.5 px-3">Cancel</button>
          </>
        ) : (
          <button onClick={() => setRejecting(true)} className="glass-btn-outline text-xs py-1.5 px-3 text-red-400 border-red-500/30">Archive</button>
        )}
      </div>
    </div>
  );
}
