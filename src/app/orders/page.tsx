import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PurchaseHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, payment_status, amount_cents, commission_cents, seller_earns_cents, payment_method, mpesa_receipt_number, tracking_number, buyer_confirmed_receipt, created_at, updated_at, listing_id, seller_id, buyer_id, listings(id, title, condition, location_city, listing_images(image_url, is_primary)), seller:profiles!orders_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge), buyer:profiles!orders_buyer_id_fkey(id, full_name, store_slug, store_name, verified_badge)"
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-medium">No orders yet</p>
        <p className="text-gray-500 text-sm mt-1">Your purchase and sale history will appear here.</p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          Browse Listings
        </Link>
      </div>
    );
  }

  const formatPrice = (cents: number) =>
    `KES ${Math.round(cents).toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Purchase History</h1>

      <div className="space-y-4">
        {orders.map((order: any) => {
          const isBuyer = order.buyer_id === user.id;
          const listing = order.listings;
          const images = (listing?.listing_images || [])
            .sort((a: any, b: any) => (a.is_primary ? -1 : 1))
            .map((img: any) => img.image_url);
          const counterparty = isBuyer ? order.seller : order.buyer;

          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {images[0] ? (
                    <Image src={images[0]} alt={listing?.title || ""} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{listing?.title || "Unknown item"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isBuyer ? "Purchased from" : "Sold to"}{" "}
                        <span className="font-medium">
                          {counterparty?.store_name || counterparty?.full_name || "User"}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        order.status === "completed" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" || order.status === "refunded" ? "bg-red-100 text-red-700" :
                        order.status === "disputed" ? "bg-orange-100 text-orange-700" :
                        order.status === "paid" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="font-semibold text-emerald-700">{formatPrice(order.amount_cents)}</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString("en-KE", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                    {order.tracking_number && (
                      <span className="font-mono">#{order.tracking_number.slice(0, 8)}</span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gray-50 rounded-xl p-5">
        <h2 className="font-semibold mb-3">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Orders</p>
            <p className="text-xl font-bold">{orders.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Completed</p>
            <p className="text-xl font-bold text-green-600">
              {orders.filter((o: any) => o.status === "completed").length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total Spent</p>
            <p className="text-xl font-bold text-emerald-700">
              {formatPrice(
                orders.filter((o: any) => o.buyer_id === user.id && o.status === "completed")
                  .reduce((s: number, o: any) => s + o.amount_cents, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total Earned</p>
            <p className="text-xl font-bold text-emerald-700">
              {formatPrice(
                orders.filter((o: any) => o.seller_id === user.id && o.status === "completed")
                  .reduce((s: number, o: any) => s + o.seller_earns_cents, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
