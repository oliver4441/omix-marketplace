import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, store_slug, store_name, rating_avg, rating_count")
    .eq("id", user.id)
    .single();

  // Fetch user's listings with images
  const { data: listings } = await supabase
    .from("listings")
    .select("*, listing_images(image_url, is_primary)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch orders (both as buyer and seller)
  const { data: orders } = await supabase
    .from("orders")
    .select("*, listings(title), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const totalEarned = (orders ?? [])
    .filter((o: any) => o.status === "completed" && o.seller_id === user.id)
    .reduce((sum: number, o: any) => sum + (o.seller_earns_cents || 0), 0);

  const totalSpent = (orders ?? [])
    .filter((o: any) => o.status === "completed" && o.buyer_id === user.id)
    .reduce((sum: number, o: any) => sum + (o.amount_cents || 0), 0);

  const activeListings = listings?.filter((l: any) => l.status === "active").length ?? 0;
  const pendingListings = listings?.filter((l: any) => l.status === "pending_review").length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {profile?.store_name && (
            <Link href={`/store/${profile.store_slug}`} className="text-sm text-emerald-600 hover:underline">
              View your store →
            </Link>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href="/messages"
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            💬 Messages
          </Link>
          <Link
            href="/sell"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Active Listings</p>
          <p className="text-2xl font-bold">{activeListings}</p>
          {pendingListings > 0 && (
            <p className="text-xs text-yellow-600 mt-1">{pendingListings} pending review</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-emerald-700">{formatPrice(totalEarned)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-2xl font-bold">{orders?.length ?? 0}</p>
        </div>
      </div>

      {/* Listings Table */}
      <h2 className="text-lg font-semibold mb-4">My Listings</h2>
      <div className="bg-white rounded-xl border overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Listing</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Views</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings?.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {l.listing_images?.[0]?.image_url ? (
                        <img src={l.listing_images[0].image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-xs text-gray-400">{l.location_city}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-medium">{formatPrice(l.price)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    l.status === "active" ? "bg-green-100 text-green-700" :
                    l.status === "pending_review" ? "bg-yellow-100 text-yellow-700" :
                    l.status === "sold" ? "bg-blue-100 text-blue-700" :
                    l.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {l.status === "pending_review" ? "Pending" : l.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{l.views}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/listings/${l.id}`} className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {(!listings || listings.length === 0) && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No listings yet. <Link href="/sell" className="text-emerald-600">Create your first listing!</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Orders */}
      {orders && orders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Orders</h2>
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Listing</th>
                  <th className="text-left p-3">Counterparty</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const isBuyer = o.buyer_id === user.id;
                  return (
                    <tr key={o.id} className="border-t">
                      <td className="p-3 font-medium">{(o.listings as any)?.title ?? "—"}</td>
                      <td className="p-3 text-gray-500">
                        {isBuyer ? (o.seller as any)?.full_name : (o.buyer as any)?.full_name}
                        <span className="text-xs text-gray-400 ml-1">({isBuyer ? "Seller" : "Buyer"})</span>
                      </td>
                      <td className="p-3">{formatPrice(o.amount_cents)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === "completed" ? "bg-green-100 text-green-700" :
                          o.status === "paid" ? "bg-blue-100 text-blue-700" :
                          o.status === "disputed" ? "bg-orange-100 text-orange-700" :
                          o.status === "cancelled" || o.status === "refunded" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {ORDER_STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
