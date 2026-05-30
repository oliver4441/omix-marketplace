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
  profiles?: { full_name: string | null };
  listing_images?: { image_url: string }[];
}

export default function AdminListingsClient({ listings }: { listings: ListingRow[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Listings</h1>
      {listings && listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((l) => (
            <ListingItem key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>No listings need review</p>
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
    if ("error" in result) {
      alert(result.error);
    }
    window.location.reload();
  }

  async function handleReject() {
    const reason = rejecting ? rejectReason : "Archived by admin";
    if (rejecting && !reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    const result = await rejectListing(listing.id, reason);
    if ("error" in result) {
      alert(result.error);
    }
    window.location.reload();
  }

  return (
    <div className={`bg-white p-4 rounded-xl border flex items-center gap-4 ${listing.status === "reported" ? "border-red-300 bg-red-50" : ""}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
        {listing.listing_images?.[0]?.image_url ? (
          <img src={listing.listing_images[0].image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{listing.title}</h3>
          {listing.status === "reported" && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Reported</span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          by {listing.profiles?.full_name ?? "—"} · {listing.location_city}
        </p>
        <p className="text-emerald-700 font-semibold">{formatPrice(listing.price)}</p>
        {rejecting && (
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            className="mt-2 text-sm border rounded px-2 py-1 w-full"
          />
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleApprove}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 cursor-pointer"
        >
          Approve
        </button>
        {rejecting ? (
          <>
            <button
              onClick={handleReject}
              className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={() => setRejecting(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setRejecting(true)}
            className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
