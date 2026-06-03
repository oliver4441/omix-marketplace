export const dynamic = "force-dynamic";

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
  if (!user) redirect("/auth/login");

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(`id:cart_id, listing_id, quantity, listing:listings(title, price, condition, location_city, listing_images(image_url, is_primary, sort_order), seller:profiles(full_name, store_name))`)
    .eq("user_id", user.id);

  const items: CartItem[] = (cartItems || []).map((item: Record<string, unknown>) => {
    const listing = item.listing as Record<string, unknown>;
    const images = ((listing?.listing_images as Record<string, unknown>[]) || []).sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)).map((img) => img.image_url as string);
    return {
      cart_id: item.id as string, listing_id: item.listing_id as string, title: listing?.title as string || "Unknown",
      price: listing?.price as number || 0, condition: listing?.condition as string || "",
      location: listing?.location_city as string || "", images: images.length > 0 ? images : null,
      seller_name: ((listing?.seller as Record<string, unknown>)?.store_name as string) || ((listing?.seller as Record<string, unknown>)?.full_name as string) || "Unknown",
      quantity: item.quantity as number || 1,
    };
  });

  return <CheckoutForm cartItems={items} />;
}
