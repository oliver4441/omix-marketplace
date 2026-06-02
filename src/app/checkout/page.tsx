import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

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

export default async function CheckoutPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(`
      id:cart_id,
      listing_id,
      quantity,
      listing:listings (
        title,
        price,
        condition,
        location,
        images,
        seller:profiles ( full_name )
      )
    `)
    .eq("user_id", user.id);

  const items: CartItem[] = (cartItems || []).map((item: any) => ({
    cart_id: item.id,
    listing_id: item.listing_id,
    title: item.listing?.title || "Unknown",
    price: item.listing?.price || 0,
    condition: item.listing?.condition || "",
    location: item.listing?.location_city || "",
    images: item.listing?.images || null,
    seller_name: item.listing?.seller?.full_name || "Unknown",
    quantity: item.quantity || 1,
  }));

  return <CheckoutForm cartItems={items} />;
}
