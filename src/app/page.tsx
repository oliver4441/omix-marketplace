import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Omix Marketplace — Buy & Sell in Kericho, Kenya",
  description: "The trusted P2P marketplace for Kericho. Buy and sell electronics, furniture, clothing, vehicles, and more.",
};

const PAGE_SIZE = 12;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; category?: string; condition?: string;
    min_price?: string; max_price?: string; location?: string;
    sort?: string; page?: string;
  }>;
}) {
  const params = await searchParams;
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
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

  switch (sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "oldest": query = query.order("created_at", { ascending: true }); break;
    case "popular": query = query.order("views", { ascending: false }); break;
    default: query = query.order("featured", { ascending: false }).order("created_at", { ascending: false }); break;
  }

  if (params.q) { const q = params.q.replace(/[%_]/g, "").trim(); if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`); }
  if (params.category) { const cat = CATEGORIES.find((c) => c.slug === params.category); if (cat) query = query.eq("category_id", cat.id); }
  if (params.condition) query = query.eq("condition", params.condition);
  if (params.min_price) query = query.gte("price", Math.round(parseFloat(params.min_price) * 100));
  if (params.max_price) query = query.lte("price", Math.round(parseFloat(params.max_price) * 100));
  if (params.location) query = query.ilike("location_city", `%${params.location}%`);
  query = query.range(offset, offset + PAGE_SIZE - 1);

  let listings: any[] = [];
  let totalListings = 0;
  let totalPages = 0;
  try {
    const { data, count, error } = await query;
    if (!error) { listings = data || []; totalListings = count || 0; totalPages = Math.ceil(totalListings / PAGE_SIZE); }
  } catch (err: any) {
    console.error("[HomePage] Error:", err.message);
  }

  const fp = new URLSearchParams();
  if (params.q) fp.set("q", params.q);
  if (params.category) fp.set("category", params.category);
  if (params.condition) fp.set("condition", params.condition);
  if (sort !== "newest") fp.set("sort", sort);
  const filterStr = fp.toString();

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Viewed" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="glass-card p-6 md:p-8 mb-6" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,78,59,0.3))" }}>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Buy & Sell in Kericho</h1>
        <p className="mt-2 text-gray-300 text-sm md:text-base">The trusted P2P marketplace. Secure payments via M-Pesa, verified sellers.</p>
        <form className="mt-4 max-w-lg flex gap-2" method="get">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search listings..."
            className="glass-input flex-1"
          />
          <button type="submit" className="glass-btn text-sm">Search</button>
        </form>
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className={`badge ${params.category === cat.slug ? "badge-accent" : ""}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <div className="glass-card p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
            <div className="space-y-1">
              <Link href="/" className={`block px-2.5 py-1.5 rounded-lg text-sm transition-colors ${!params.category ? "bg-emerald-500/15 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                All Categories
              </Link>
              {CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/?category=${cat.slug}`} className={`block px-2.5 py-1.5 rounded-lg text-sm transition-colors ${params.category === cat.slug ? "bg-emerald-500/15 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Condition</h3>
            <div className="space-y-1">
              <Link href="/" className={`block px-2.5 py-1.5 rounded-lg text-sm transition-colors ${!params.condition ? "bg-emerald-500/15 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                All Conditions
              </Link>
              {CONDITIONS.map((c) => (
                <Link key={c.value} href={`/?condition=${c.value}`} className={`block px-2.5 py-1.5 rounded-lg text-sm transition-colors ${params.condition === c.value ? "bg-emerald-500/15 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p className="text-sm text-gray-400">{totalListings} listing{totalListings !== 1 ? "s" : ""} found</p>
            <form method="get" className="flex items-center gap-2">
              {params.category && <input type="hidden" name="category" value={params.category} />}
              {params.condition && <input type="hidden" name="condition" value={params.condition} />}
              {params.q && <input type="hidden" name="q" value={params.q} />}
              <select name="sort" defaultValue={sort} className="glass-input text-sm py-1.5 px-3 w-auto">
                {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button type="submit" className="glass-btn-outline text-xs py-1.5 px-3">Apply</button>
            </form>
            {/* Mobile category scroll */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full">
              <Link href="/" className={`badge whitespace-nowrap ${!params.category ? "badge-accent" : ""}`}>All</Link>
              {CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/?category=${cat.slug}`} className={`badge whitespace-nowrap ${params.category === cat.slug ? "badge-accent" : ""}`}>{cat.name}</Link>
              ))}
            </div>
          </div>

          {listings && listings.length > 0 ? (
            <>
              <div className="tile-grid">
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
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link href={`/?page=${page - 1}${filterStr ? `&${filterStr}` : ""}`} className="glass-btn-outline text-xs py-1.5 px-3">Previous</Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    if (p > totalPages || p < 1) return null;
                    return (
                      <Link key={p} href={`/?page=${p}${filterStr ? `&${filterStr}` : ""}`} className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${p === page ? "bg-emerald-600 text-white font-semibold" : "text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"}`}>
                        {p}
                      </Link>
                    );
                  })}
                  {page < totalPages && (
                    <Link href={`/?page=${page + 1}${filterStr ? `&${filterStr}` : ""}`} className="glass-btn-outline text-xs py-1.5 px-3">Next</Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-300 text-lg font-medium mb-2">No listings found</p>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or be the first to list.</p>
              <Link href="/sell" className="glass-btn text-sm">Create First Listing</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
