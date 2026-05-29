import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import { deleteProduct, markAsSold } from "@/lib/actions/products";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const products = await prisma.product.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
  });

  const orders = await prisma.order.findMany({
    where: role === "admin" ? {} : { sellerId: userId },
    include: { product: { select: { title: true } } },
  });

  const totalSales = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amount, 0);
  const totalCommission = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.commission, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "sold": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <Link
          href="/sell"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + List New Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">{formatPrice(totalSales)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Commission Paid</p>
          <p className="text-2xl font-bold">{formatPrice(totalCommission)}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Views</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.location}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-medium">{formatPrice(p.price)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{p.views}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {p.status === "active" && (
                      <form action={markAsSold.bind(null, p.id)}>
                        <button className="text-xs text-blue-600 hover:underline cursor-pointer">
                          Mark Sold
                        </button>
                      </form>
                    )}
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button className="text-xs text-red-600 hover:underline cursor-pointer">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No products yet. <Link href="/sell" className="text-emerald-600">List your first item!</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Orders */}
      {orders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Orders</h2>
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3">{o.product?.title ?? "—"}</td>
                    <td className="p-3">{formatPrice(o.amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === "delivered" ? "bg-green-100 text-green-700" :
                        o.status === "paid" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
