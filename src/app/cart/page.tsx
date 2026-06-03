import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/constants";
import { removeFromCart, clearCart } from "@/lib/actions/cart";

export const dynamic = "force-dynamic";

interface CartItem {
  cart_id: string;
  listing_id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  status: string;
  images: string[] | null;
  seller_name: string;
  seller_slug: string | null | undefined;
  quantity: number;
}

export default async function CartPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: cartData } = await supabase
    .from("cart_items")
    .select("id, listing_id, quantity, listings(id, title, price, condition, location_city, status, listing_images(image_url, is_primary, sort_order), profiles!listings_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge))")
    .eq("user_id", user.id)
    .order("added_at", { ascending: true });

  const items: CartItem[] = (cartData || [])
    .map((item: Record<string, unknown>) => {
      const l = item.listings as Record<string, unknown>;
      if (!l) return null;
      const images = ((l.listing_images as Record<string, unknown>[]) || []).sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)).map((img) => img.image_url as string);
      const profData = Array.isArray(l.profiles) ? (l.profiles as Record<string, unknown>[])?.[0] : (l.profiles as Record<string, unknown>);
      return {
        cart_id: item.id as string, listing_id: l.id as string, title: l.title as string, price: l.price as number,
        condition: l.condition as string, location: l.location_city as string, status: l.status as string,
        images: images.length > 0 ? images : null,
        seller_name: (profData?.store_name as string) || (profData?.full_name as string) || "Seller",
        seller_slug: profData?.store_slug as string | null | undefined, quantity: item.quantity as number,
      };
    })
    .filter(Boolean) as CartItem[];

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Shopping Cart</h1>
          <p className="text-[#6a6a6a] text-sm mt-1">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
        </div>
        {items.length > 0 && (
          <form action={clearCart}>
            <button type="submit" className="text-sm text-[#ff385c] hover:underline">Clear Cart</button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#ebebeb] rounded-[14px]">
          <p className="text-lg font-medium text-[#222222] mb-2">Your cart is empty</p>
          <p className="text-[#6a6a6a] text-sm mb-4">Browse listings and add items to your cart.</p>
          <Link href="/" className="inline-block px-4 py-2 btn-primary text-sm">Browse Listings</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.cart_id} className="bg-white border border-[#ebebeb] rounded-[14px] p-4 flex gap-4">
                <Link href={`/listings/${item.listing_id}`} className="w-24 h-24 bg-[#f7f7f7] rounded-xl overflow-hidden shrink-0">
                  {item.images?.[0] ? <Image src={item.images[0]} alt={item.title} width={96} height={96} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#c1c1c1] text-sm">No img</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${item.listing_id}`}><h3 className="font-medium text-sm hover:text-[#ff385c] transition-colors line-clamp-2 text-[#222222]">{item.title}</h3></Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-[#8f8f8f]">{item.condition}</span>
                    <span className="text-xs text-[#c1c1c1]">|</span>
                    <span className="text-xs text-[#8f8f8f]">{item.location}</span>
                  </div>
                  <p className="text-lg font-bold text-[#222222] mt-2">{formatPrice(item.price)}</p>
                  <p className="text-xs text-[#8f8f8f] mt-1">Sold by {item.seller_slug ? <Link href={`/store/${item.seller_slug}`} className="text-[#ff385c] hover:underline">{item.seller_name}</Link> : item.seller_name}</p>
                </div>
                <div className="flex flex-col items-end justify-between shrink-0">
                  <form action={async (formData: FormData) => { "use server"; await removeFromCart(item.listing_id); }}>
                    <button type="submit" className="text-xs text-[#ff385c] hover:underline">Remove</button>
                  </form>
                  <p className="font-semibold text-[#222222]">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-[#ebebeb] rounded-[14px] p-5 sticky top-[88px]">
              <h2 className="font-semibold text-lg mb-4 text-[#222222]">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#6a6a6a]">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span><span className="text-[#222222]">{formatPrice(subtotal)}</span></div>
                <div className="border-t border-[#ebebeb] pt-2 mt-2 flex justify-between font-bold text-base">
                  <span className="text-[#222222]">Total</span>
                  <span className="text-[#222222]">{formatPrice(total)}</span>
                </div>
              </div>
              <Link href="/checkout" className="block w-full mt-4 py-3 btn-primary text-center rounded-xl font-medium">
                Proceed to Checkout
              </Link>
              <p className="text-xs text-[#8f8f8f] text-center mt-3">Secure checkout with M-Pesa. No card required.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
