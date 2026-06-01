"use client";

import { useEffect, useState, Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ===== INLINE ICONS ===== */
const Icon = ({ d, size = "w-4 h-4", round }: { d: string; size?: string; round?: boolean }) => (
  <svg className={size} fill="none" stroke="currentColor" strokeWidth={round ? 2 : 1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const SearchIcon = () => <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" size="w-4 h-4" round />;

/* ===== PARTICLES ===== */
function LiveParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      w: `${2 + Math.random() * 2}px`,
      h: `${2 + Math.random() * 2}px`,
      bg: i % 3 === 0 ? "#10b981" : i % 3 === 1 ? "#3b82f6" : "#8b5cf6",
      op: 0.08 + Math.random() * 0.1,
      left: `${Math.random() * 100}%`,
      dur: `${20 + Math.random() * 25}s`,
      del: `${Math.random() * 20}s`,
    }))
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-full" style={{ width: p.w, height: p.h, background: p.bg, opacity: p.op, left: p.left, bottom: "-2%", animation: `particleFloat ${p.dur} linear infinite`, animationDelay: p.del }} />
      ))}
    </div>
  );
}

/* ===== PROFILE HELPER ===== */
function prof(p: any) { return Array.isArray(p) ? p?.[0] || {} : (p || {}); }

/* ===== MAIN CONTENT ===== */
function HomeContent() {
  const sp = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = sp.get("q") || "";
  const cat = sp.get("category") || "";
  const cond = sp.get("condition") || "";
  const sort = sp.get("sort") || "newest";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supa = createClient();
        let query = supa.from("listings").select("id, title, price, condition, location_city, created_at, is_negotiable, featured, views, category_id, listing_images(image_url, is_primary, sort_order), profiles!listings_seller_id_fkey(id, full_name, store_slug, store_name, verified_badge, rating_avg)", { count: "exact" }).eq("status", "active");
        if (sort === "price_asc") query = query.order("price", { ascending: true });
        else if (sort === "price_desc") query = query.order("price", { ascending: false });
        else if (sort === "oldest") query = query.order("created_at", { ascending: true });
        else if (sort === "popular") query = query.order("views", { ascending: false });
        else query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
        if (q) { const s = q.replace(/[%_]/g, "").trim(); if (s) query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`); }
        if (cat) { const c = CATEGORIES.find(x => x.slug === cat); if (c) query = query.eq("category_id", c.id); }
        if (cond) query = query.eq("condition", cond);
        query = query.range((page - 1) * 12, page * 12 - 1);
        const { data, count, error } = await query;
        if (!cancel && !error) { setListings(data || []); setTotal(count || 0); }
      } catch (e) { console.error(e); } finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [q, cat, cond, sort, page]);

  const pages = Math.ceil(total / 12);
  const fp = new URLSearchParams();
  if (q) fp.set("q", q);
  if (cat) fp.set("category", cat);
  if (cond) fp.set("condition", cond);
  if (sort !== "newest") fp.set("sort", sort);
  const fs = fp.toString();

  const sorts = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Viewed" },
  ];

  return (
    <div className="page-enter">
      {/* HERO */}
      <div className="hero-bg relative overflow-hidden">
        <LiveParticles />
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-12 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
              <span className="text-emerald-400 text-xs font-medium">Trusted marketplace in Kenya</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Buy & Sell.<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">Simple & Secure.</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm md:text-base max-w-xl mx-auto">The leading P2P marketplace in Kericho. Discover great deals, connect with verified sellers, pay securely via M-Pesa.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/sell" className="glass-btn text-sm px-6 py-2.5">Start Selling</Link>
              <Link href="/services" className="glass-btn-outline text-sm px-6 py-2.5">Browse Services</Link>
            </div>
          </div>

          <form className="max-w-2xl mx-auto mb-8" method="get">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></div>
                <input name="q" defaultValue={q} placeholder="Search electronics, furniture, vehicles..." className="glass-input pl-10 h-12" />
              </div>
              <button type="submit" className="glass-btn h-12 px-5"><SearchIcon /><span className="hidden sm:inline">Search</span></button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Link href="/" className={`badge text-xs ${!cat ? "badge-accent" : ""}`}>All</Link>
            {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className={`badge text-xs ${cat === c.slug ? "badge-accent" : ""}`}>{c.name}</Link>)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: <Icon d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" size="w-5 h-5" />, label: "M-Pesa", sub: "Secure Payments", c: "emerald" },
              { icon: <Icon d="M9 12L11 14L15 10M12 3L4 7V12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12V7L12 3Z" size="w-5 h-5" />, label: "Escrow", sub: "Buyer Protection", c: "blue" },
              { icon: <Icon d="M14 16V6a2 2 0 00-2-2H4a2 2 0 00-2 2v10M15 16H9M19 16h1a2 2 0 002-2v-4a2 2 0 00-2-2h-3" size="w-5 h-5" />, label: "Delivery", sub: "Kericho & Beyond", c: "purple" },
              { icon: <Icon d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" size="w-5 h-5" />, label: "Local", sub: "Verified Sellers", c: "amber" },
            ].map((s, i) => (
              <div key={i} className="glass-card p-4 text-center hover:scale-[1.02] transition-transform">
                <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${s.c === "emerald" ? "bg-emerald-500/10 text-emerald-400" : s.c === "blue" ? "bg-blue-500/10 text-blue-400" : s.c === "purple" ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-400"}`}>{s.icon}</div>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LISTINGS */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="glass-card p-4 mb-4 sticky top-20">
              <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
              <div className="space-y-0.5">
                <Link href="/" className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!cat ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>All Categories</Link>
                {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${cat === c.slug ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>{c.name}</Link>)}
              </div>
            </div>
            <div className="glass-card p-4 sticky top-96">
              <h3 className="text-sm font-semibold text-white mb-3">Condition</h3>
              <div className="space-y-0.5">
                <Link href="/" className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!cond ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>All Conditions</Link>
                {CONDITIONS.map((c) => <Link key={c.value} href={`/?condition=${c.value}`} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${cond === c.value ? "bg-emerald-500/15 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>{c.label}</Link>)}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm text-slate-400"><span className="text-white font-medium">{total}</span> listing{total !== 1 ? "s" : ""} found</p>
              <form method="get" className="flex items-center gap-2">
                {cat && <input type="hidden" name="category" value={cat} />}
                {cond && <input type="hidden" name="condition" value={cond} />}
                {q && <input type="hidden" name="q" value={q} />}
                <select name="sort" defaultValue={sort} className="glass-input text-sm py-1.5 px-3 w-auto">{sorts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                <button type="submit" className="glass-btn-outline text-xs py-1.5 px-3">Apply</button>
              </form>
            </div>

            {loading ? (
              <div className="glass-card p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Loading listings...</p>
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="tile-grid">
                  {listings.map((l) => {
                    const imgs = (l.listing_images || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((img: any) => img.image_url);
                    const p = prof(l.profiles);
                    return <ProductCard key={l.id} id={l.id} title={l.title} price={l.price} condition={l.condition} location={l.location_city} images={imgs.length > 0 ? imgs : null} isNegotiable={l.is_negotiable} isFeatured={l.featured} viewCount={l.views} createdAt={l.created_at} sellerName={p.store_name || p.full_name} sellerVerified={p.verified_badge} sellerStoreSlug={p.store_slug} sellerRating={p.rating_avg} />;
                  })}
                </div>
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && <Link href={`/?page=${page - 1}${fs ? `&${fs}` : ""}`} className="glass-btn-outline text-xs py-1.5 px-4">Previous</Link>}
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => { const p = Math.max(1, Math.min(page - 2, pages - 4)) + i; return (p > pages || p < 1) ? null : <Link key={p} href={`/?page=${p}${fs ? `&${fs}` : ""}`} className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${p === page ? "bg-emerald-600 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"}`}>{p}</Link>; })}
                    {page < pages && <Link href={`/?page=${page + 1}${fs ? `&${fs}` : ""}`} className="glass-btn-outline text-xs py-1.5 px-4">Next</Link>}
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center">
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

/* ===== PAGE WRAPPER ===== */
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
