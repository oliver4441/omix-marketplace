import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import { deleteProduct, markAsSold } from "@/lib/actions/products";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(title)")
    .eq("seller_id", user.id);

  const totalSales =
    orders
      ?.filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.amount, 0) ?? 0;
  const totalCommission =
    orders
      ?.filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.commission, 0) ?? 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "sold":
        return "bg-gray-100 text-gray-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-500">Welcome, {profile?.full_name}</p>
        </div>
        <Link
          href="/sell"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
        >
          + List New Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border">
          <p className="text-sm text-gray-500">Active Listings</p>
          <p className="text-3xl font-bold mt-1">
            {products?.filter((p) => p.status === "active").length ?? 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-3xl font-bold mt-1">{formatPrice(totalSales)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border">
          <p className="text-sm text-gray-500">Earnings (after commission)</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">
            {formatPrice(totalSales - totalCommission)}
          </p>
        </div>
      </div>

      {/* My Listings */}
      <h2 className="text-lg font-semibold mb-4">My Listings</h2>
      {products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-xl border flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    📦
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{p.title}</h3>
                <p className="text-emerald-700 font-semibold">
                  {formatPrice(p.price)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(p.status)}`}
              >
                {p.status}
              </span>
              {p.status === "active" && (
                <form action={markAsSold.bind(null, p.id)}>
                  <button className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg">
                    Mark Sold
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>
            No listings yet.{" "}
            <Link href="/sell" className="text-emerald-600 font-medium">
              List your first item!
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
