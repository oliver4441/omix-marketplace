"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import { updateOrderStatus } from "@/lib/actions/admin";

interface OrderRow {
  id: string;
  status: string;
  amount_cents: number;
  listings?: { title: string }[] | { title: string };
  profiles?: { full_name: string }[] | { full_name: string };
}

export default function AdminOrdersClient({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Order Management</h1>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-slate-400 font-medium">Order ID</th>
              <th className="text-left p-3 text-slate-400 font-medium">Listing</th>
              <th className="text-left p-3 text-slate-400 font-medium">Buyer</th>
              <th className="text-left p-3 text-slate-400 font-medium">Amount</th>
              <th className="text-left p-3 text-slate-400 font-medium">Status</th>
              <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderRowItem key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRowItem({ order }: { order: OrderRow }) {
  const [error, setError] = useState<string | null>(null);

  async function handleAction(status: string) {
    setError(null);
    const result = await updateOrderStatus(order.id, status);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      window.location.reload();
    }
  }

  return (
    <>
      <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
        <td className="p-3 font-mono text-xs text-slate-400">{order.id.slice(0, 8)}</td>
        <td className="p-3 text-slate-300">{(Array.isArray(order.listings) ? order.listings[0]?.title : order.listings?.title) ?? "—"}</td>
        <td className="p-3 text-slate-300">{(Array.isArray(order.profiles) ? order.profiles[0]?.full_name : order.profiles?.full_name) ?? "—"}</td>
        <td className="p-3 text-slate-300">{formatPrice(order.amount_cents)}</td>
        <td className="p-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
            order.status === "paid" ? "bg-blue-500/15 text-blue-400" :
            order.status === "cancelled" || order.status === "refunded" ? "bg-red-500/15 text-red-400" :
            "bg-amber-500/15 text-amber-400"
          }`}>
            {order.status}
          </span>
        </td>
        <td className="p-3">
          <div className="flex gap-2">
            {order.status === "pending" && (
              <button
                onClick={() => handleAction("cancelled")}
                className="text-xs px-2 py-1 border border-red-500/30 text-red-400 rounded cursor-pointer hover:bg-red-500/10"
              >
                Cancel
              </button>
            )}
            {order.status === "paid" && (
              <button
                onClick={() => handleAction("shipped")}
                className="text-xs px-2 py-1 glass-btn rounded cursor-pointer"
              >
                Mark Shipped
              </button>
            )}
            {order.status === "shipped" && (
              <button
                onClick={() => handleAction("delivered")}
                className="text-xs px-2 py-1 glass-btn rounded cursor-pointer"
              >
                Mark Delivered
              </button>
            )}
          </div>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="p-2">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded">
              {error}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
