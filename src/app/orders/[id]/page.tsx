import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch order with all relations
  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, listings(id, title, price, condition, location_city, listing_images(image_url, is_primary, sort_order)), buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url, store_slug, phone), seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url, store_slug, store_name, phone, verified_badge, rating_avg, rating_count)"
    )
    .eq("id", id)
    .single();

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-medium">Order not found</p>
        <Link href="/dashboard" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const orderData = order as any;
  const isBuyer = orderData.buyer_id === user.id;
  const isSeller = orderData.seller_id === user.id;

  if (!isBuyer && !isSeller) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-medium">Access denied</p>
        <Link href="/dashboard" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Fetch status history
  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  // Fetch delivery info
  const { data: delivery } = await supabase
    .from("delivery_logistics")
    .select("*")
    .eq("order_id", id)
    .single();

  const listing = orderData.listings;
  const images = (listing?.listing_images || [])
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img: any) => img.image_url);

  const statusSteps = ["pending", "paid", "shipped", "delivered", "completed"];
  const currentStatusIndex = statusSteps.indexOf(orderData.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-emerald-600 hover:underline">
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">Order Details</h1>
          <p className="text-xs text-slate-400">Order #{orderData.id.slice(0, 8)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            orderData.status === "completed" ? "bg-emerald-500/15 text-green-400" :
            orderData.status === "cancelled" || orderData.status === "refunded" ? "bg-red-500/15 text-red-400" :
            orderData.status === "disputed" ? "bg-orange-100 text-orange-700" :
            orderData.status === "paid" ? "bg-blue-500/15 text-blue-400" :
            "bg-amber-500/15 text-yellow-400"
          }`}
        >
          {ORDER_STATUS_LABELS[orderData.status] || orderData.status}
        </span>
      </div>

      {/* Order Timeline */}
      <div className="glass-card rounded-xl border p-5 mb-6">
        <h2 className="font-semibold mb-4">Order Timeline</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {statusSteps.map((step, i) => {
            const isComplete = currentStatusIndex >= i;
            const isCurrent = statusSteps[currentStatusIndex] === step;
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center min-w-[60px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isComplete ? "bg-emerald-600 text-[var(--text-primary)]" : "bg-white/15 text-slate-400"
                    } ${isCurrent ? "ring-2 ring-emerald-300" : ""}`}
                  >
                    {isComplete ? "" : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 capitalize ${isCurrent ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                    {step}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`w-8 h-0.5 mb-4 ${isComplete && currentStatusIndex > i ? "bg-emerald-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status history */}
        {history && history.length > 0 && (
          <div className="mt-6 pt-4 border-t space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Status History</h3>
            {history.map((entry: any) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium capitalize">{entry.status}</p>
                  {entry.notes && <p className="text-slate-400 text-xs">{entry.notes}</p>}
                  <p className="text-slate-400 text-xs">
                    {new Date(entry.created_at).toLocaleDateString("en-KE", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Item + Seller */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item */}
          <div className="glass-card rounded-xl border p-5">
            <h2 className="font-semibold mb-4">Item</h2>
            <div className="flex gap-4">
              <Link href={`/listings/${listing?.id}`} className="w-20 h-20 bg-white/10 rounded-lg overflow-hidden shrink-0">
                {images[0] ? (
                  <Image src={images[0]} alt={listing?.title || ""} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No image</div>
                )}
              </Link>
              <div>
                <Link href={`/listings/${listing?.id}`} className="font-medium hover:text-emerald-400 transition">
                  {listing?.title}
                </Link>
                <p className="text-sm text-slate-400 mt-0.5">{listing?.condition} - {listing?.location_city}</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{formatPrice(orderData.amount_cents)}</p>
              </div>
            </div>
          </div>

          {/* Counterparty */}
          <div className="glass-card rounded-xl border p-5">
            <h2 className="font-semibold mb-4">{isBuyer ? "Seller" : "Buyer"}</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {(isBuyer ? orderData.seller?.full_name?.[0] : orderData.buyer?.full_name?.[0]) || "?"}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium">
                    {isBuyer ? (orderData.seller?.store_name || orderData.seller?.full_name) : orderData.buyer?.full_name}
                  </p>
                  {isBuyer && orderData.seller?.verified_badge && (
                    <span className="text-emerald-600 text-xs">Verified</span>
                  )}
                </div>
                {isBuyer && orderData.seller?.store_slug && (
                  <Link href={`/store/${orderData.seller.store_slug}`} className="text-xs text-emerald-600 hover:underline">
                    View Store
                  </Link>
                )}
                {isBuyer && orderData.seller?.phone && (
                  <a
                    href={`https://wa.me/${orderData.seller.phone.replace(/^0/, "254")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-1"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Delivery */}
          {(delivery || orderData.tracking_number) && (
            <div className="glass-card rounded-xl border p-5">
              <h2 className="font-semibold mb-4">Delivery</h2>
              {orderData.tracking_number && (
                <p className="text-sm"><span className="text-slate-400">Tracking:</span> <span className="font-mono">{orderData.tracking_number}</span></p>
              )}
              {delivery && (
                <div className="mt-2 space-y-1 text-sm text-slate-300">
                  <p>Status: <span className="capitalize font-medium">{delivery.delivery_status}</span></p>
                  {delivery.courier_name && <p>Courier: {delivery.courier_name}</p>}
                  {delivery.estimated_distance_km && <p>Distance: {delivery.estimated_distance_km} km</p>}
                  <p>Fee: {formatPrice(delivery.estimated_fee_cents || 0)}</p>
                </div>
              )}
              {orderData.estimated_delivery_at && (
                <p className="text-sm text-slate-400 mt-2">
                  Estimated delivery: {new Date(orderData.estimated_delivery_at).toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Payment Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl border p-5 sticky top-20">
            <h2 className="font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Item price</span>
                <span>{formatPrice(orderData.amount_cents)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform fee (5%)</span>
                <span>-{formatPrice(orderData.commission_cents)}</span>
              </div>
              {delivery?.estimated_fee_cents && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery</span>
                  <span>{formatPrice(delivery.estimated_fee_cents)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-emerald-400">{formatPrice(orderData.amount_cents)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment method</span>
                <span className="capitalize">{orderData.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment status</span>
                <span className={`capitalize font-medium ${
                  orderData.payment_status === "paid" ? "text-emerald-400" :
                  orderData.payment_status === "failed" ? "text-red-400" :
                  "text-yellow-400"
                }`}>
                  {orderData.payment_status}
                </span>
              </div>
              {orderData.mpesa_receipt_number && (
                <div className="flex justify-between">
                  <span className="text-slate-400">M-Pesa receipt</span>
                  <span className="font-mono">{orderData.mpesa_receipt_number}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              {isBuyer && orderData.status === "delivered" && !orderData.buyer_confirmed_receipt && (
                <button className="w-full py-2 bg-emerald-600 text-[var(--text-primary)] rounded-lg text-sm font-medium hover:bg-emerald-700">
                  Confirm Receipt
                </button>
              )}
              {isSeller && orderData.status === "paid" && (
                <button className="w-full py-2 border border-emerald-600 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-50">
                  Mark as Shipped
                </button>
              )}
              {(isBuyer || isSeller) && orderData.status === "pending" && (
                <Link
                  href={`/messages`}
                  className="block w-full py-2 border text-center rounded-lg text-sm font-medium hover:var(--bg-hover)"
                >
                  Message {isBuyer ? "Seller" : "Buyer"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
