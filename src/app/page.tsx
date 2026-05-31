import { createClient } from "@/utils/supabase/server";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
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
    condition?: string;
    min_price?: string;
    max_price?: string;
    location?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const sort = params.sort || "newest";

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, condition, location_city, created_at, is_negotiable, featured, views, category_id, listing_images(image_url, is_primary, sort_order), profiles!listings_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge, rating_avg)",
      { count: "exact" }
    )
    .eq("status", "active");

  // Sorting
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "popular":
      query = query.order("views", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      break;
  }

  if (params.q) {
    const q = params.q.replace(/[%_]/g, "").trim();
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (params.category) {
    const cat = CATEGORIES.find((c) => c.slug === params.category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (params.condition) {
    query = query.eq("condition", params.condition);
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

  query = query.range(offset, offset + PAGE_SIZE - 1);

  let listings: any[] = [];
  let totalListings = 0;
  let totalPages = 0;
  try {
    const { data, count, error } = await query;
    if (error) {
      console.error("[HomePage] Supabase error:", error.message);
    } else {
      listings = data || [];
      totalListings = count || 0;
      totalPages = Math.ceil(totalListings / PAGE_SIZE);
    }
  } catch (err: any) {
    console.error("[HomePage] Failed to fetch listings:", err.message);
  }

  // Preserve filter params in pagination links
  const fp = new URLSearchParams();
  if (params.q) fp.set("q", params.q);
  if (params.category) fp.set("category", params.category);
  if (params.condition) fp.set("condition", params.condition);
  if (params.min_price) fp.set("min_price", params.min_price);
  if (params.max_price) fp.set("max_price", params.max_price);
  if (params.location) fp.set("location", params.location);
  if (sort !== "newest") fp.set("sort", sort);
  const filterStr = fp.toString();

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Viewed" },
    { value: "oldest", label: "Oldest First" },
  ];

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
              href={`/?${fp.toString()}`}
              className={`block px-3 py-2 rounded-lg text-sm ${
                !params.category ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-50"
              }`}
            >
              All Categories
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}${filterStr && filterStr.includes("q=") ? `&q=${params.q}` : ""}${filterStr && filterStr.includes("min_price=") ? `&min_price=${params.min_price}&max_price=${params.max_price}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  params.category === cat.slug ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-50"
                }`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>

          {/* Condition Filter */}
          <h2 className="font-semibold mb-3">Condition</h2>
          <div className="space-y-1 mb-6">
            <Link
              href={`/?${fp.toString().replace(/condition=[^&]*/g, "")}`}
              className={`block px-3 py-2 rounded-lg text-sm ${
                !params.condition ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-50"
              }`}
            >
              All Conditions
            </Link>
            {CONDITIONS.map((c) => {
              const condParams = new URLSearchParams(filterStr);
              condParams.set("condition", c.value);
              return (
                <Link
                  key={c.value}
                  href={`/?${condParams.toString()}`}
                  className={`block px-3 py-2 rounded-lg text-sm ${
                    params.condition === c.value ? "bg-emerald-50 text-emerald-700 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          {/* Price Range Filter */}
          <h2 className="font-semibold mb-3">Price Range (KES)</h2>
          <form className="space-y-2 mb-6" method="get">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.condition && <input type="hidden" name="condition" value={params.condition} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            <div className="flex gap-2">
              <input name="min_price" type="number" placeholder="Min" defaultValue={params.min_price ?? ""} className="w-full px-2 py-1.5 border rounded text-sm" />
              <input name="max_price" type="number" placeholder="Max" defaultValue={params.max_price ?? ""} className="w-full px-2 py-1.5 border rounded text-sm" />
            </div>
            <button type="submit" className="w-full py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">Apply</button>
          </form>

          {/* Location filter */}
          <h2 className="font-semibold mb-3">Location</h2>
          <form method="get">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.condition && <input type="hidden" name="condition" value={params.condition} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            <input
              name="location"
              placeholder="e.g., Kericho Town"
              defaultValue={params.location ?? ""}
              className="w-full px-2 py-1.5 border rounded text-sm"
            />
            <button type="submit" className="w-full py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 mt-2">Filter</button>
          </form>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1">
          {/* Toolbar: sort + mobile filters + count */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <p className="text-gray-500 text-sm">
              {totalListings} listing{totalListings !== 1 ? "s" : ""} found
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Sort by:</label>
              <form method="get" className="flex items-center">
                {params.category && <input type="hidden" name="category" value={params.category} />}
                {params.condition && <input type="hidden" name="condition" value={params.condition} />}
                {params.q && <input type="hidden" name="q" value={params.q} />}
                {params.min_price && <input type="hidden" name="min_price" value={params.min_price} />}
                {params.max_price && <input type="hidden" name="max_price" value={params.max_price} />}
                {params.location && <input type="hidden" name="location" value={params.location} />}
                <select
                  name="sort"
                  defaultValue={sort}
                  onChange={(e) => e.target.form?.requestSubmit()}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </form>
            </div>
            {/* Mobile category pills */}
            <div className="md:hidden flex gap-1 overflow-x-auto pb-1 w-full">
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
                    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
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
                      sellerName={listing.profiles?.store_name || listing.profiles?.full_name}
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
                      Prev
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    if (p > totalPages || p < 1) return null;
                    return (
                      <Link
                        key={p}
                        href={`/?page=${p}${filterStr ? `&${filterStr}` : ""}`}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
                          p === page ? "bg-emerald-600 text-white" : "border hover:bg-gray-50"
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
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">No listings found</p>
              <p className="text-lg font-medium">No listings match your criteria</p>
              <p className="text-sm mt-1">Try adjusting your filters or be the first to list.</p>
              <Link
                href="/sell"
                className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Create First Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
