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
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Order ID</th>
              <th className="text-left p-3">Listing</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
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
      <tr key={order.id} className="border-t">
        <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
        <td className="p-3">{(Array.isArray(order.listings) ? order.listings[0]?.title : order.listings?.title) ?? "—"}</td>
        <td className="p-3">{(Array.isArray(order.profiles) ? order.profiles[0]?.full_name : order.profiles?.full_name) ?? "—"}</td>
        <td className="p-3">{formatPrice(order.amount_cents)}</td>
        <td className="p-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.status === "completed" ? "bg-green-100 text-green-700" :
            order.status === "paid" ? "bg-blue-100 text-blue-700" :
            order.status === "cancelled" || order.status === "refunded" ? "bg-red-100 text-red-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            {order.status}
          </span>
        </td>
        <td className="p-3">
          <div className="flex gap-2">
            {order.status === "pending" && (
              <button
                onClick={() => handleAction("cancelled")}
                className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded cursor-pointer hover:bg-red-50"
              >
                Cancel
              </button>
            )}
            {order.status === "paid" && (
              <button
                onClick={() => handleAction("shipped")}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
              >
                Mark Shipped
              </button>
            )}
            {order.status === "shipped" && (
              <button
                onClick={() => handleAction("delivered")}
                className="text-xs px-2 py-1 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700"
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
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded">
              {error}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
