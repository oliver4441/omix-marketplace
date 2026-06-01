import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PurchaseHistoryPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
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
        <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
        <p className="text-lg font-medium text-white">No orders yet</p>
        <p className="text-slate-400 text-sm mt-1">Your purchase and sale history will appear here.</p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 glass-btn text-sm font-medium">
          Browse Listings
        </Link>
      </div>
    );
  }

  const formatPrice = (cents: number) =>
    `KES ${Math.round(cents).toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;

  const totalSpent = orders.filter((o: any) => o.buyer_id === user.id && o.status === "completed").reduce((s: number, o: any) => s + o.amount_cents, 0);
  const totalEarned = orders.filter((o: any) => o.seller_id === user.id && o.status === "completed").reduce((s: number, o: any) => s + o.seller_earns_cents, 0);
  const completedCount = orders.filter((o: any) => o.status === "completed").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Purchase History</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Total Orders</p>
          <p className="text-xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-xl font-bold text-emerald-400">{completedCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Total Spent</p>
          <p className="text-xl font-bold text-blue-400">{formatPrice(totalSpent)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Total Earned</p>
          <p className="text-xl font-bold text-emerald-400">{formatPrice(totalEarned)}</p>
        </div>
      </div>

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
              <div className="glass-card p-4 hover:border-emerald-500/30 transition-colors cursor-pointer flex gap-4">
                <div className="w-20 h-20 bg-white/5 rounded-xl overflow-hidden shrink-0">
                  {images[0] ? (
                    <Image src={images[0]} alt={listing?.title || ""} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No img</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-200 truncate">{listing?.title || "Unknown item"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isBuyer ? "Purchased from" : "Sold to"}{" "}
                        <span className="font-medium text-slate-400">
                          {counterparty?.store_name || counterparty?.full_name || "User"}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        order.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                        order.status === "cancelled" || order.status === "refunded" ? "bg-red-500/15 text-red-400" :
                        order.status === "disputed" ? "bg-orange-500/15 text-orange-400" :
                        order.status === "paid" ? "bg-blue-500/15 text-blue-400" :
                        "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="font-semibold text-emerald-400">{formatPrice(order.amount_cents)}</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString("en-KE", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                    {order.tracking_number && (
                      <span className="font-mono text-slate-500">#{order.tracking_number.slice(0, 8)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center shrink-0 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
