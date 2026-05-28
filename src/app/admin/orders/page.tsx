import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { confirmPayment, updateOrderStatus } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/constants";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(title), profiles!orders_buyer_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Order ID</th>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Receipt</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                <td className="p-3">{order.products?.title ?? "—"}</td>
                <td className="p-3">{order.profiles?.full_name ?? "—"}</td>
                <td className="p-3">{formatPrice(order.amount)}</td>
                <td className="p-3 font-mono text-xs">{order.mpesa_receipt ?? "—"}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{order.status}</span>
                </td>
                <td className="p-3">
                  {order.status === "pending_payment" && (
                    <form action={confirmPayment.bind(null, order.id)}>
                      <button className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium">Confirm Payment</button>
                    </form>
                  )}
                  {order.status === "paid" && (
                    <form action={updateOrderStatus.bind(null, order.id, "in_transit")}>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">Mark In Transit</button>
                    </form>
                  )}
                  {order.status === "in_transit" && (
                    <form action={updateOrderStatus.bind(null, order.id, "delivered")}>
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">Mark Delivered</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
