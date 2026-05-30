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
  profiles?: { full_name: string };
  orders?: { amount_cents: number; listings?: { title: string } };
}

export default function AdminDisputesClient({ disputes }: { disputes: DisputeRow[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dispute Resolution</h1>
      {disputes && disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((d) => (
            <DisputeItem key={d.id} dispute={d} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>No disputes</p>
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
    if ("error" in result) {
      setError(result.error);
    } else {
      window.location.reload();
    }
  }

  return (
    <div className={`bg-white p-4 rounded-xl border ${dispute.status === "open" ? "border-red-300" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Order #{dispute.order_id?.slice(0, 8)}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              dispute.status === "open" ? "bg-red-100 text-red-700" :
              dispute.status === "resolved" ? "bg-green-100 text-green-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {dispute.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Opened by: {dispute.profiles?.full_name ?? "—"} ·{" "}
            {new Date(dispute.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm mt-2"><strong>Reason:</strong> {dispute.reason}</p>
          {(dispute.orders as any)?.listings?.title && (
            <p className="text-sm text-gray-500">
              Listing: {(dispute.orders as any).listings.title} · {formatPrice((dispute.orders as any).amount_cents)}
            </p>
          )}
          {dispute.resolution_notes && (
            <p className="text-sm mt-2 bg-green-50 p-2 rounded">
              <strong>Resolution:</strong> {dispute.resolution_notes}
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
              className="text-sm border rounded px-2 py-1 w-48 block"
            />
            <button
              onClick={handleResolve}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer block"
            >
              Resolve
            </button>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
