import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — Buy & Sell in Kericho, Kenya",
  description: "The trusted P2P marketplace for Kericho. Buy and sell electronics, furniture, clothing, vehicles, and more.",
};

const PAGE_SIZE = 12;

// SVG Icons as components for consistency
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
);

const LocationIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
);

const MpesaIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M7 8h10M7 12h6" strokeLinecap="round"/></svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12L11 14L15 10M12 3L4 7V12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12V7L12 3Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const TruckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 16V6a2 2 0 00-2-2H4a2 2 0 00-2 2v10" strokeLinecap="round"/><path d="M15 16H9" strokeLinecap="round"/><path d="M19 16h1a2 2 0 002-2v-4a2 2 0 00-2-2h-3" strokeLinecap="round"/><circle cx="7" cy="18" r="2" strokeLinecap="round"/><circle cx="17" cy="18" r="2" strokeLinecap="round"/></svg>
);

function LiveParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 2}px`,
            height: `${2 + Math.random() * 2}px`,
            background: i % 3 === 0 ? "#10b981" : i % 3 === 1 ? "#3b82f6" : "#8b5cf6",
            opacity: 0.08 + Math.random() * 0.1,
            left: `${Math.random() * 100}%`,
            bottom: "-2%",
            animation: `particleFloat ${20 + Math.random() * 25}s linear infinite`,
            animationDelay: `${Math.random() * 20}s`,
          }}
        />
      ))}
    </div>
  );
}

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
    <div className="page-enter">
      {/* ============ HERO SECTION ============ */}
      <div className="hero-bg relative overflow-hidden">
        <LiveParticles />

        {/* Mesh gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[700px] h-[700px] rounded-full opacity-[0.05]"
            style={{
              background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
              top: "-20%",
              left: "-10%",
              animation: "blobPulse 14s ease-in-out infinite alternate",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
            style={{
              background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
              bottom: "-15%",
              right: "-8%",
              animation: "blobPulse 18s ease-in-out infinite alternate-reverse",
            }}
          />
          <div
            className="absolute w-[350px] h-[350px] rounded-full opacity-[0.03]"
            style={{
              background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
              top: "20%",
              right: "20%",
              animation: "blobPulse 22s ease-in-out infinite alternate",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-10 pb-12 relative z-10">
          <div className="text-center mb-10">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-xs font-medium">Trusted marketplace in Kenya</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Buy & Sell.<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
                Simple & Secure.
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              The leading P2P marketplace in Kericho. Discover great deals, connect with verified sellers, pay securely via M-Pesa.
            </p>

            {/* Quick action buttons */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/sell" className="glass-btn text-sm px-6 py-2.5">
                Start Selling
              </Link>
              <Link href="/services" className="glass-btn-outline text-sm px-6 py-2.5">
                Browse Services
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <form className="max-w-2xl mx-auto mb-8" method="get">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></div>
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search electronics, furniture, vehicles..."
                  className="glass-input pl-10 h-12"
                />
              </div>
              <button type="submit" className="glass-btn h-12 px-5">
                <SearchIcon />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Link href="/" className={`badge text-xs ${!params.category ? "badge-accent" : ""}`}>
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className={`badge text-xs ${params.category === cat.slug ? "badge-accent" : ""}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: <MpesaIcon />, label: "M-Pesa", sub: "Secure Payments", color: "emerald" },
              { icon: <ShieldIcon />, label: "Escrow", sub: "Buyer Protection", color: "blue" },
              { icon: <TruckIcon />, label: "Delivery", sub: "Kericho & Beyond", color: "purple" },
              { icon: <LocationIcon />, label: "Local", sub: "Verified Sellers", color: "amber" },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 text-center hover:scale-[1.02] transition-transform">
                <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                  stat.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
                  stat.color === "blue" ? "bg-blue-500/10 text-blue-400" :
                  stat.color === "purple" ? "bg-purple-500/10 text-purple-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  {stat.icon}
                </div>
                <p className="text-sm font-semibold text-white">{stat.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Subtle section background */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.02]"
            style={{
              background: "radial-gradient(circle, #10b981, transparent 70%)",
              top: "20%",
              left: "60%",
              animation: "blobPulse 16s ease-in-out infinite alternate",
            }}
          />
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="glass-card p-4 mb-4 sticky top-20">
              <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
              <div className="space-y-0.5">
                <Link href="/" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${!params.category ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                  All Categories
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link key={cat.slug} href={`/?category=${cat.slug}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${params.category === cat.slug ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 sticky top-96">
              <h3 className="text-sm font-semibold text-white mb-3">Condition</h3>
              <div className="space-y-0.5">
                <Link href="/" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${!params.condition ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  All Conditions
                </Link>
                {CONDITIONS.map((c) => (
                  <Link key={c.value} href={`/?condition=${c.value}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${params.condition === c.value ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm text-slate-400">
                <span className="text-white font-medium">{totalListings}</span> listing{totalListings !== 1 ? "s" : ""} found
              </p>
              <form method="get" className="flex items-center gap-2">
                {params.category && <input type="hidden" name="category" value={params.category} />}
                {params.condition && <input type="hidden" name="condition" value={params.condition} />}
                {params.q && <input type="hidden" name="q" value={params.q} />}
                <select name="sort" defaultValue={sort} className="glass-input text-sm py-1.5 px-3 w-auto">
                  {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <button type="submit" className="glass-btn-outline text-xs py-1.5 px-3">Apply</button>
              </form>
              <div className="md:hidden flex gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full">
                <Link href="/" className={`badge whitespace-nowrap text-xs ${!params.category ? "badge-accent" : ""}`}>All</Link>
                {CATEGORIES.map((cat) => (
                  <Link key={cat.slug} href={`/?category=${cat.slug}`} className={`badge whitespace-nowrap text-xs ${params.category === cat.slug ? "badge-accent" : ""}`}>{cat.name}</Link>
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
                      <Link href={`/?page=${page - 1}${filterStr ? `&${filterStr}` : ""}`} className="glass-btn-outline text-xs py-1.5 px-4">Previous</Link>
                    )}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      if (p > totalPages || p < 1) return null;
                      return (
                        <Link key={p} href={`/?page=${p}${filterStr ? `&${filterStr}` : ""}`} className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${p === page ? "bg-emerald-600 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"}`}>
                          {p}
                        </Link>
                      );
                    })}
                    {page < totalPages && (
                      <Link href={`/?page=${page + 1}${filterStr ? `&${filterStr}` : ""}`} className="glass-btn-outline text-xs py-1.5 px-4">Next</Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                </div>
                <p className="text-slate-300 text-lg font-medium mb-2">No listings found</p>
                <p className="text-slate-500 text-sm mb-4">Try adjusting your filters or be the first to list something.</p>
                <Link href="/sell" className="glass-btn text-sm">Create First Listing</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
