import { createClient } from "@/lib/supabase/server";
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
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const [
    { count: pendingListings },
    { count: totalOrders },
    { count: totalUsers },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*, products(title), profiles!orders_buyer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/listings"
          className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl hover:bg-yellow-100"
        >
          <p className="text-sm text-yellow-600">Pending Listings</p>
          <p className="text-3xl font-bold text-yellow-700">
            {pendingListings ?? 0}
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="bg-blue-50 border border-blue-200 p-5 rounded-xl hover:bg-blue-100"
        >
          <p className="text-sm text-blue-600">Total Orders</p>
          <p className="text-3xl font-bold text-blue-700">{totalOrders ?? 0}</p>
        </Link>
        <Link
          href="/admin/users"
          className="bg-purple-50 border border-purple-200 p-5 rounded-xl hover:bg-purple-100"
        >
          <p className="text-sm text-purple-600">Total Users</p>
          <p className="text-3xl font-bold text-purple-700">
            {totalUsers ?? 0}
          </p>
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders?.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3">{order.products?.title ?? "—"}</td>
                <td className="p-3">{order.profiles?.full_name ?? "—"}</td>
                <td className="p-3">{formatPrice(order.amount)}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
