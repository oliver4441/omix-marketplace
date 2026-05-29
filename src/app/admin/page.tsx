import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if ((session.user as any).role !== "admin") redirect("/");

  const [
    pendingCount,
    totalOrders,
    totalUsers,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "pending" } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { title: true } }, buyer: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/admin/listings" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Pending Listings</p>
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
        </Link>
        <Link href="/admin/orders" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-emerald-600">{totalOrders}</p>
        </Link>
        <Link href="/admin/users" className="bg-white p-6 rounded-xl border hover:shadow-sm transition">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
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
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3">{order.product?.title ?? "—"}</td>
                <td className="p-3">{order.buyer?.name ?? "—"}</td>
                <td className="p-3">{formatPrice(order.amount)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "delivered" ? "bg-green-100 text-green-700" :
                    order.status === "paid" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
