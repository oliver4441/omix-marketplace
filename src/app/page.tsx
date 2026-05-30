import { createClient } from "@/utils/supabase/server";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    location?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (params.q) {
    const q = params.q.replace(/[%_]/g, "").trim();
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (params.category) {
    const cat = CATEGORIES.find((c) => c.slug === params.category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (params.min_price) {
    query = query.gte("price", Math.round(parseFloat(params.min_price) * 100));
  }

  if (params.max_price) {
    query = query.lte("price", Math.round(parseFloat(params.max_price) * 100));
  }

  if (params.location) {
    query = query.ilike("location_city", `%${params.location}%`);
  }

  const { data: listings } = await query;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-emerald-700 text-white rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold">Buy & Sell in Kericho</h1>
        <p className="mt-2 text-emerald-100">
          The trusted P2P marketplace. Secure payments, verified sellers.
        </p>
        <form className="mt-4 max-w-xl flex gap-2" method="get">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search listings..."
            className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-white text-emerald-700 rounded-lg font-medium hover:bg-emerald-50"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-56 shrink-0 hidden md:block">
          <h2 className="font-semibold mb-3">Categories</h2>
          <div className="space-y-1 mb-6">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm ${
                !params.category
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              All Categories
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  params.category === cat.slug
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>

          {/* Price Range Filter */}
          <h2 className="font-semibold mb-3">Price Range (KES)</h2>
          <form className="space-y-2" method="get">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <div className="flex gap-2">
              <input
                name="min_price"
                type="number"
                placeholder="Min"
                defaultValue={params.min_price ?? ""}
                className="w-full px-2 py-1.5 border rounded text-sm"
              />
              <input
                name="max_price"
                type="number"
                placeholder="Max"
                defaultValue={params.max_price ?? ""}
                className="w-full px-2 py-1.5 border rounded text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Apply
            </button>
          </form>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-4">
            {listings?.length ?? 0} listings found
          </p>
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing: any) => (
                <ProductCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  condition={listing.condition}
                  location={listing.location_city}
                  images={listing.listing_images?.[0]?.image_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🏪</p>
              <p className="text-lg font-medium">No listings found</p>
              <p className="text-sm">Try adjusting your filters or be the first to list!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
