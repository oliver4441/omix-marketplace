import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/constants";
import { removeFromCart, clearCart } from "@/lib/actions/cart";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: cartData } = await supabase
    .from("cart_items")
    .select(
      "id, listing_id, quantity, listings(id, title, price, condition, location_city, status, listing_images(image_url, is_primary, sort_order), profiles!listings_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge))"
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: true });

  const items = (cartData || [])
    .map((item: any) => {
      const l = item.listings;
      if (!l) return null;
      const images = (l.listing_images || [])
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((img: any) => img.image_url);
      return {
        cart_id: item.id, listing_id: l.id, title: l.title, price: l.price,
        condition: l.condition, location: l.location_city, status: l.status,
        images: images.length > 0 ? images : null,
        seller_name: l.profiles?.store_name || l.profiles?.full_name || "Seller",
        seller_slug: l.profiles?.store_slug, quantity: item.quantity,
      };
    })
    .filter(Boolean);

  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const commission = Math.round(subtotal * 0.05);
  const total = subtotal;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-slate-400 text-sm mt-1">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
        </div>
        {items.length > 0 && (
          <form action={clearCart}>
            <button type="submit" className="text-sm text-red-400 hover:text-red-400 hover:underline">
              Clear Cart
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl border">
          <p className="text-lg font-medium text-slate-300 mb-2">Your cart is empty</p>
          <p className="text-slate-400 text-sm mb-4">Browse listings and add items to your cart.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => (
              <div key={item.cart_id} className="glass-card rounded-xl border p-4 flex gap-4">
                <Link href={`/listings/${item.listing_id}`} className="w-24 h-24 bg-white/10 rounded-lg overflow-hidden shrink-0">
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.title} width={96} height={96} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No image</div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${item.listing_id}`}>
                    <h3 className="font-medium text-sm hover:text-emerald-400 transition-colors line-clamp-2">{item.title}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">{item.condition}</span>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-400">{item.location}</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400 mt-2">{formatPrice(item.price)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Sold by {item.seller_slug ? (
                      <Link href={`/store/${item.seller_slug}`} className="text-emerald-600 hover:underline">{item.seller_name}</Link>
                    ) : item.seller_name}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between shrink-0">
                  <form action={async (formData: FormData) => {
                    "use server";
                    await removeFromCart(item.listing_id);
                  }}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-400">Remove</button>
                  </form>
                  <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-xl border p-5 sticky top-20">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform fee (5%)</span>
                  <span>{formatPrice(commission)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-emerald-400">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="block w-full mt-4 py-3 bg-emerald-600 text-white rounded-lg text-center font-medium hover:bg-emerald-700 transition"
              >
                Proceed to Checkout
              </Link>
              <p className="text-xs text-slate-400 text-center mt-3">
                Secure checkout with M-Pesa. No card required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
