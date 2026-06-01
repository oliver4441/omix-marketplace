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
      <h1 className="text-2xl font-bold mb-6 text-white">Checkout</h1>

      {step === "success" ? (
        <div className="glass-card p-8 text-center border-emerald-500/30">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <p className="text-xl font-bold text-white mb-2">Order Placed!</p>
          <p className="text-slate-300 font-medium">Your order has been created successfully.</p>
          <p className="text-sm text-slate-400 mt-2">You will receive an M-Pesa STK push prompt on your phone to complete payment.</p>
          <p className="text-xs text-slate-500 mt-4">Redirecting to order details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="glass-card p-5">
                <h2 className="font-semibold mb-4 text-white">Delivery Information</h2>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-400 mb-4">
                  Items are arranged for pickup or delivery between buyer and seller after payment confirmation.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                    <input required className="glass-input" defaultValue="" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">M-Pesa Phone *</label>
                    <input
                      required
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Pickup / Delivery Location</label>
                    <input required placeholder="e.g., Kericho Town, near university" className="glass-input" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h2 className="font-semibold mb-4 text-white">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border-2 border-emerald-500/50 bg-emerald-500/10 rounded-xl cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="accent-emerald-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white">M-Pesa STK Push</p>
                      <p className="text-xs text-slate-400">Pay directly from your M-Pesa account. Secure and instant.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl cursor-not-allowed opacity-50">
                    <input type="radio" name="payment" disabled />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-400">Cash on Delivery</p>
                      <p className="text-xs text-slate-500">Available for nearby locations. (Coming soon)</p>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/cart" className="flex-1 py-3 glass-btn-outline text-center rounded-xl font-medium">
                  Back to Cart
                </Link>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 py-3 glass-btn rounded-xl font-medium disabled:opacity-50"
                >
                  {step === "processing" ? "Processing..." : `Pay ${formatPrice(total)}`}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card p-5 sticky top-20">
              <h2 className="font-semibold mb-4 text-white">Order Summary ({cartItems.length})</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="flex gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden shrink-0">
                      {item.images?.[0] ? (
                        <Image src={item.images[0]} alt={item.title} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">--</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.seller_name}</p>
                      <p className="text-sm font-semibold text-emerald-400">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="text-slate-300">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Platform fee</span><span className="text-slate-400">{formatPrice(commission)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10 text-white"><span>Total</span><span className="text-emerald-400">{formatPrice(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
