"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/constants";
import { resolveDispute } from "@/lib/actions/admin";

interface DisputeRow {
  id: string;
  status: string;
  reason: string;
  resolution_notes?: string;
  created_at: string;
  order_id: string;
  profiles?: { full_name: string }[] | { full_name: string };
  orders?: { amount_cents: number; listings?: { title: string }[] | { title: string } }[] | { amount_cents: number; listings?: { title: string }[] | { title: string } };
}

function getProfileName(p: DisputeRow['profiles']): string {
  if (!p) return "—";
  if (Array.isArray(p)) return p[0]?.full_name ?? "—";
  return p.full_name;
}

function getOrderInfo(o: DisputeRow['orders']): { amount_cents: number; title: string } | null {
  if (!o) return null;
  const order = Array.isArray(o) ? o[0] : o;
  if (!order) return null;
  const listings = order.listings;
  let title = "";
  if (listings) {
    if (Array.isArray(listings)) title = listings[0]?.title ?? "";
    else title = (listings as { title: string }).title ?? "";
  }
  return { amount_cents: order.amount_cents, title };
}

export default function AdminDisputesClient({ disputes }: { disputes: DisputeRow[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Dispute Resolution</h1>
      {disputes && disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((d) => (
            <DisputeItem key={d.id} dispute={d} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-slate-400">No disputes</p>
        </div>
      )}
    </div>
  );
}

function DisputeItem({ dispute }: { dispute: DisputeRow }) {
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    setError(null);
    if (!resolution.trim()) {
      setError("Please enter resolution notes");
      return;
    }
    const result = await resolveDispute(dispute.id, resolution.trim());
    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("success" in result) {
      window.location.reload();
    }
  }

  return (
    <div className={`glass-card p-4 ${dispute.status === "open" ? "border-red-500/30" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">Order #{dispute.order_id?.slice(0, 8)}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              dispute.status === "open" ? "bg-red-500/15 text-red-400" :
              dispute.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
              "bg-slate-500/15 text-slate-400"
            }`}>
              {dispute.status}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Opened by: {getProfileName(dispute.profiles)} ·{" "}
            {new Date(dispute.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm mt-2 text-slate-300"><strong>Reason:</strong> {dispute.reason}</p>
          {(() => { const info = getOrderInfo(dispute.orders); return info ? (
            <p className="text-sm text-slate-400">
              Listing: {info.title} · {formatPrice(info.amount_cents)}
            </p>
          ) : null; })()}
          {dispute.resolution_notes && (
            <p className="text-sm mt-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-slate-300">
              <strong className="text-emerald-400">Resolution:</strong> {dispute.resolution_notes}
            </p>
          )}
        </div>
        {dispute.status === "open" && (
          <div className="shrink-0 ml-4 space-y-2">
            <input
              type="text"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Resolution notes..."
              className="glass-input text-sm w-48"
            />
            <button
              onClick={handleResolve}
              className="text-xs px-3 py-1.5 glass-btn rounded-lg cursor-pointer block"
            >
              Resolve
            </button>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
