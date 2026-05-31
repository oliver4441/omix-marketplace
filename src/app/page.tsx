import { createClient } from "@/utils/supabase/server";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Omix Marketplace — Buy & Sell in Kericho, Kenya",
  description:
    "The trusted P2P marketplace for Kericho. Buy and sell electronics, furniture, clothing, vehicles, and more. Secure payments, verified sellers.",
  openGraph: {
    title: "Omix Marketplace",
    description: "Buy & Sell in Kericho — The trusted P2P marketplace",
    type: "website",
  },
};

const PAGE_SIZE = 20;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    location?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("listings")
    .select(
      "*, profiles!listings_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge, rating_avg), listing_images(image_url, is_primary)",
      { count: "exact" }
    )
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

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

  const { data: listings, count } = await query;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const totalListings = count || 0;

  // Preserve filter params in pagination links
  const filterParams = new URLSearchParams();
  if (params.q) filterParams.set("q", params.q);
  if (params.category) filterParams.set("category", params.category);
  if (params.min_price) filterParams.set("min_price", params.min_price);
  if (params.max_price) filterParams.set("max_price", params.max_price);
  if (params.location) filterParams.set("location", params.location);
  const filterStr = filterParams.toString();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold">Buy &amp; Sell in Kericho</h1>
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
        {/* Quick category chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.slice(0, 6).map((cat) => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-sm transition"
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters — desktop */}
        <aside className="w-56 shrink-0 hidden md:block">
          <h2 className="font-semibold mb-3">Categories</h2>
          <div className="space-y-1 mb-6">
            <Link
              href={"/" + (filterStr && !filterStr.startsWith("category") ? `?${filterStr}` : "")}
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
                href={`/?category=${cat.slug}${filterStr && filterStr.includes("q=") ? `&q=${params.q}` : ""}${filterStr && filterStr.includes("min_price=") ? `&min_price=${params.min_price}&max_price=${params.max_price}` : ""}`}
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

          {/* Location filter */}
          <h2 className="font-semibold mb-3 mt-6">Location</h2>
          <form method="get">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <input
              name="location"
              placeholder="e.g., Kericho Town"
              defaultValue={params.location ?? ""}
              className="w-full px-2 py-1.5 border rounded text-sm"
            />
            <button
              type="submit"
              className="w-full py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 mt-2"
            >
              Filter
            </button>
          </form>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1">
          {/* Mobile filter toggle + result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">
              {totalListings} listing{totalListings !== 1 ? "s" : ""} found
            </p>
            {/* Mobile category pills */}
            <div className="md:hidden flex gap-1 overflow-x-auto pb-1">
              <Link
                href="/"
                className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                  !params.category ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                All
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/?category=${cat.slug}`}
                  className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                    params.category === cat.slug ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cat.icon}
                </Link>
              ))}
            </div>
          </div>

          {listings && listings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing: any) => {
                  const images = (listing.listing_images || [])
                    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                    .map((img: any) => img.image_url);

                  return (
                    <ProductCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      price={listing.price}
                      condition={listing.condition}
                      location={listing.location_city}
                      images={images.length > 0 ? images : null}
                      isNegotiable={listing.is_negotiable}
                      isFeatured={listing.featured}
                      viewCount={listing.views}
                      createdAt={listing.created_at}
                      sellerName={
                        listing.profiles?.store_name || listing.profiles?.full_name
                      }
                      sellerVerified={listing.profiles?.verified_badge}
                      sellerStoreSlug={listing.profiles?.store_slug}
                      sellerRating={listing.profiles?.rating_avg}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link
                      href={`/?page=${page - 1}${filterStr ? `&${filterStr}` : ""}`}
                      className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                    >
                      ← Prev
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    if (p > totalPages) return null;
                    return (
                      <Link
                        key={p}
                        href={`/?page=${p}${filterStr ? `&${filterStr}` : ""}`}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
                          p === page
                            ? "bg-emerald-600 text-white"
                            : "border hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                  {page < totalPages && (
                    <Link
                      href={`/?page=${page + 1}${filterStr ? `&${filterStr}` : ""}`}
                      className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🏪</p>
              <p className="text-lg font-medium">No listings found</p>
              <p className="text-sm">Try adjusting your filters or be the first to list!</p>
              <Link
                href="/sell"
                className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                + Create First Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
