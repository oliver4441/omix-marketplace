import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { confirmPayment, updateOrderStatus } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/constants";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if ((session.user as any).role !== "admin") redirect("/");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { title: true } },
      buyer: { select: { name: true } },
    },
  });

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
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                <td className="p-3">{order.product?.title ?? "—"}</td>
                <td className="p-3">{order.buyer?.name ?? "—"}</td>
                <td className="p-3">{formatPrice(order.amount)}</td>
                <td className="p-3 font-mono text-xs">{order.mpesaReceipt ?? "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "delivered" ? "bg-green-100 text-green-700" :
                    order.status === "paid" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-3">
                  {order.status === "pending_payment" && order.mpesaReceipt && (
                    <form action={confirmPayment.bind(null, order.id)}>
                      <button className="text-xs px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700">
                        Confirm
                      </button>
                    </form>
                  )}
                  {order.status === "paid" && (
                    <form action={updateOrderStatus.bind(null, order.id, "delivery")}>
                      <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
                        Ship
                      </button>
                    </form>
                  )}
                  {order.status === "delivery" && (
                    <form action={updateOrderStatus.bind(null, order.id, "delivered")}>
                      <button className="text-xs px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700">
                        Delivered
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
