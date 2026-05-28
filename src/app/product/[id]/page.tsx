import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createOrder } from "@/lib/actions/orders";
import { sendInquiry } from "@/lib/actions/inquiries";
import {
  formatPrice,
  CONDITIONS,
  CATEGORIES,
  TILL_NUMBER,
  DELIVERY_ZONES,
} from "@/lib/constants";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select("*, profiles(full_name, phone)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const conditionLabel = CONDITIONS.find(
    (c) => c.value === product.condition
  )?.label;
  const category = CATEGORIES.find((c) => c.id === product.category_id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full aspect-square object-cover rounded-xl"
            />
          ) : (
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl">
              📦
            </div>
          )}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-2">
              {product.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-600"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <span className="bg-gray-100 text-xs font-medium px-2 py-1 rounded-full">
              {conditionLabel}
            </span>
            {category && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                {category.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-3xl font-bold text-emerald-700">
            {formatPrice(product.price)}
          </p>
          <p className="text-gray-600 whitespace-pre-wrap">
            {product.description}
          </p>

          <div className="bg-white p-4 rounded-xl border space-y-2">
            <p className="text-sm">
              <strong>Location:</strong> {product.location}
            </p>
            <p className="text-sm">
              <strong>Seller:</strong> {product.profiles?.full_name}
            </p>
          </div>

          {/* Inquiry form */}
          {user && user.id !== product.seller_id && (
            <form
              action={async (fd) => {
                "use server";
                await sendInquiry(id, fd.get("message") as string);
              }}
              className="space-y-2"
            >
              <textarea
                name="message"
                placeholder="Hi, I'm interested in this item..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
              >
                Send Inquiry
              </button>
            </form>
          )}

          {!user && (
            <Link
              href="/auth/login"
              className="block w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-center"
            >
              Sign In to Inquire
            </Link>
          )}

          {/* Buy Now section */}
          {user && user.id !== product.seller_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-amber-800">How to Buy</p>
              <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                <li>
                  Pay via M-Pesa to{" "}
                  <strong>
                    Till {TILL_NUMBER} (Cooperative Bank)
                  </strong>
                </li>
                <li>Share your receipt below</li>
                <li>We deliver to your doorstep in Kericho!</li>
              </ol>
              <form
                action={async () => {
                  "use server";
                  // Just show the buy info for now
                }}
                className="space-y-2"
              >
                <select
                  name="delivery_zone_id"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select delivery zone</option>
                  {DELIVERY_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — KES {z.fee}
                    </option>
                  ))}
                </select>
                <input
                  name="delivery_address"
                  placeholder="Your delivery address"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
                >
                  Request to Buy
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
