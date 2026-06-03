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
  const total = subtotal;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 10) { setError("Enter a valid phone number (07XXXXXXXX)"); return; }
    setPaying(true);
    setStep("processing");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const orderIds: string[] = [];
      for (const item of cartItems) {
        const { data: listing } = await supabase.from("listings").select("id, seller_id, price, title, status").eq("id", item.listing_id).single();
        if (!listing || listing.status !== "active") { setError(`"${item.title}" is no longer available.`); setPaying(false); setStep("review"); return; }
        const { data: order, error: orderError } = await supabase.from("orders").insert({
          listing_id: item.listing_id, buyer_id: user.id, seller_id: listing.seller_id,
          amount_cents: listing.price, commission_cents: Math.round(listing.price * 0.05),
          seller_earns_cents: listing.price - Math.round(listing.price * 0.05),
          status: "pending", payment_method: "mpesa", payment_status: "pending",
          mpesa_phone: phone.replace(/^0/, "254"),
        }).select("id").single();
        if (orderError) { setError(orderError.message); setPaying(false); setStep("review"); return; }
        orderIds.push(order.id as string);
        await supabase.from("listings").update({ status: "sold" }).eq("id", item.listing_id);
        await supabase.from("order_status_history").insert({ order_id: order.id, status: "pending", notes: "Order created, awaiting M-Pesa payment" });
      }
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      setStep("success");
      if (orderIds.length > 0) { setTimeout(() => { router.push(`/orders/${orderIds[0]}`); }, 2000); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPaying(false);
      setStep("review");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Checkout</h1>
      {step === "success" ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(39,166,68,0.08)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#27a644]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] mb-2">Order Placed!</p>
          <p className="text-[var(--text-secondary)] font-medium">Your order has been created successfully.</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">You will receive an M-Pesa STK push prompt on your phone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-5">
                <h2 className="font-semibold mb-4 text-[var(--text-primary)]">Delivery Information</h2>
                <div className="bg-[rgba(255,56,92,0.04)] border border-[rgba(255,56,92,0.1)] rounded-xl p-3 text-sm text-[#ff385c] mb-4">
                  Items are arranged for pickup or delivery between buyer and seller after payment confirmation.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Full Name</label><input required className="airbnb-input" /></div>
                  <div><label className="block text-sm font-medium text-[var(--text-primary)] mb-1">M-Pesa Phone *</label><input required type="tel" placeholder="07XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="airbnb-input" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Pickup / Delivery Location</label><input required placeholder="e.g., Kericho Town, near university" className="airbnb-input" /></div>
                </div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-5">
                <h2 className="font-semibold mb-4 text-[var(--text-primary)]">Payment Method</h2>
                <label className="flex items-center gap-3 p-3 border-2 border-[#222222] bg-[var(--bg-secondary)] rounded-xl cursor-pointer">
                  <input type="radio" name="payment" defaultChecked className="accent-[#222222]" />
                  <div className="flex-1"><p className="font-medium text-sm text-[var(--text-primary)]">M-Pesa STK Push</p><p className="text-xs text-[var(--text-muted)]">Pay directly from your M-Pesa account. Secure and instant.</p></div>
                </label>
              </div>
              {error && <div className="bg-[rgba(255,56,92,0.06)] border border-[rgba(255,56,92,0.15)] text-[#ff385c] p-3 rounded-xl text-sm">{error}</div>}
              <div className="flex gap-3">
                <Link href="/cart" className="flex-1 py-3 btn-outline text-center rounded-xl font-medium">Back to Cart</Link>
                <button type="submit" disabled={paying} className="flex-1 py-3 btn-primary rounded-xl font-medium disabled:opacity-50">
                  {step === "processing" ? "Processing..." : `Pay ${formatPrice(total)}`}
                </button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-5 sticky top-[88px]">
              <h2 className="font-semibold mb-4 text-[var(--text-primary)]">Order Summary ({cartItems.length})</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="flex gap-3">
                    <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg overflow-hidden shrink-0">
                      {item.images?.[0] ? <Image src={item.images[0]} alt={item.title} width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#c1c1c1] text-xs">--</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.seller_name}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border-light)] pt-3 mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span className="text-[var(--text-primary)]">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--border-light)] text-[var(--text-primary)]"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
