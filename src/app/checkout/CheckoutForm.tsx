"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/constants";

interface CartItem {
  cart_id: string;
  listing_id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  images: string[] | null;
  seller_name: string;
  quantity: number;
}

export default function CheckoutForm({ cartItems }: { cartItems: CartItem[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"review" | "payment" | "processing" | "success">("review");

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const commission = Math.round(subtotal * 0.05);
  const total = subtotal;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone || phone.length < 10) {
      setError("Enter a valid phone number (07XXXXXXXX)");
      return;
    }

    setPaying(true);
    setStep("processing");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const orderIds: string[] = [];
      for (const item of cartItems) {
        const { data: listing } = await supabase
          .from("listings")
          .select("id, seller_id, price, title, status")
          .eq("id", item.listing_id)
          .single();

        if (!listing || listing.status !== "active") {
          setError(`"${item.title}" is no longer available.`);
          setPaying(false);
          setStep("review");
          return;
        }

        const amountCents = listing.price;
        const commissionCents = Math.round(amountCents * 0.05);
        const sellerEarnsCents = amountCents - commissionCents;

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            listing_id: item.listing_id,
            buyer_id: user.id,
            seller_id: listing.seller_id,
            amount_cents: amountCents,
            commission_cents: commissionCents,
            seller_earns_cents: sellerEarnsCents,
            status: "pending",
            payment_method: "mpesa",
            payment_status: "pending",
            mpesa_phone: phone.replace(/^0/, "254"),
          })
          .select("id")
          .single();

        if (orderError) {
          setError(orderError.message);
          setPaying(false);
          setStep("review");
          return;
        }

        orderIds.push(order.id);

        await supabase.from("listings").update({ status: "sold" }).eq("id", item.listing_id);

        await supabase.from("order_status_history").insert({
          order_id: order.id,
          status: "pending",
          notes: "Order created, awaiting M-Pesa payment",
        });
      }

      await supabase.from("cart_items").delete().eq("user_id", user.id);

      setStep("success");

      if (orderIds.length > 0) {
        setTimeout(() => {
          router.push(`/orders/${orderIds[0]}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Checkout failed");
      setPaying(false);
      setStep("review");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {step === "success" ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">Order Placed!</p>
          <p className="text-emerald-700 font-medium">Your order has been created successfully.</p>
          <p className="text-sm text-emerald-600 mt-2">You will receive an M-Pesa STK push prompt on your phone to complete payment.</p>
          <p className="text-xs text-gray-500 mt-4">Redirecting to order details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-4">Delivery Information</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-4">
                  Items are arranged for pickup or delivery between buyer and seller after payment confirmation.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" defaultValue="" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone *</label>
                    <input
                      required
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup / Delivery Location</label>
                    <input required placeholder="e.g., Kericho Town, near university" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border-2 border-emerald-500 bg-emerald-50 rounded-lg cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">M-Pesa STK Push</p>
                      <p className="text-xs text-gray-500">Pay directly from your M-Pesa account. Secure and instant.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-not-allowed opacity-50">
                    <input type="radio" name="payment" disabled />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Available for nearby locations. (Coming soon)</p>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/cart" className="flex-1 py-3 border text-center rounded-lg font-medium hover:bg-gray-50 transition">
                  Back to Cart
                </Link>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {step === "processing" ? "Processing..." : `Pay ${formatPrice(total)}`}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-5 sticky top-20">
              <h2 className="font-semibold mb-4">Order Summary ({cartItems.length})</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.images?.[0] ? (
                        <Image src={item.images[0]} alt={item.title} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">--</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.seller_name}</p>
                      <p className="text-sm font-semibold text-emerald-700">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Platform fee</span><span>{formatPrice(commission)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span className="text-emerald-700">{formatPrice(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
