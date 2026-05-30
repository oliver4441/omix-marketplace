export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const [
    { count: activeListings },
    { count: pendingListings },
    { count: totalOrders },
    { count: totalUsers },
    { count: openDisputes },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("orders")
      .select("id, status, amount_cents, listings(title), profiles!orders_buyer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Link href="/admin/listings" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Active Listings</p>
          <p className="text-3xl font-bold text-emerald-600">{activeListings ?? 0}</p>
        </Link>
        <div className="bg-white p-6 rounded-xl border">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingListings ?? 0}</p>
        </div>
        <Link href="/admin/orders" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-blue-600">{totalOrders ?? 0}</p>
        </Link>
        <Link href="/admin/users" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-purple-600">{totalUsers ?? 0}</p>
        </Link>
        <Link href="/admin/disputes" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Open Disputes</p>
          <p className="text-3xl font-bold text-red-600">{openDisputes ?? 0}</p>
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Listing</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders?.map((order: any) => (
              <tr key={order.id} className="border-t">
                <td className="p-3">{(order.listings as any)?.title ?? "—"}</td>
                <td className="p-3">{(order.profiles as any)?.full_name ?? "—"}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
