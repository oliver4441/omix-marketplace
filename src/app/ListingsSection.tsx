"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function prof(p: unknown): ListingProfile {
  if (Array.isArray(p)) return (p?.[0] || {}) as ListingProfile;
  return (p || {}) as ListingProfile;
}

interface ListingImage {
  image_url: string;
  sort_order?: number;
}

interface ListingProfile {
  id?: string;
  full_name?: string;
  store_slug?: string | null;
  store_name?: string | null;
  verified_badge?: boolean;
  rating_avg?: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  location_city: string;
  created_at: string;
  is_negotiable: boolean;
  featured: boolean;
  views: number;
  category_id: number;
  listing_images: ListingImage[];
  profiles: ListingProfile[];
}

export default function ListingsSection() {
  const sp = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const q = sp.get("q") || "";
  const cat = sp.get("category") || "";
  const cond = sp.get("condition") || "";
  const sort = sp.get("sort") || "newest";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(false);
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
        const { data, count, error: qErr } = await query;
        if (!cancel) {
          if (qErr) { setError(true); setListings([]); setTotal(0); setLoading(false); return; }
          setListings((data || []) as unknown as Listing[]);
          setTotal(count || 0);
        }
      } catch (e) {
        console.error("Listings error:", e);
        if (!cancel) { setError(true); setListings([]); setTotal(0); }
      } finally {
        if (!cancel) setLoading(false);
      }
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="bg-white rounded-[14px] border border-[#ebebeb] p-4 mb-4 sticky top-[88px]">
            <h3 className="text-sm font-semibold text-[#222222] mb-3">Categories</h3>
            <div className="space-y-0.5">
              <Link href="/" className="block px-3 py-2 rounded-lg text-sm transition-colors bg-[rgba(255,56,92,0.06)] text-[#ff385c] font-medium">All Categories</Link>
              {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className="block px-3 py-2 rounded-lg text-sm transition-colors text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]">{c.name}</Link>)}
            </div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#ebebeb] p-4 sticky top-[340px]">
            <h3 className="text-sm font-semibold text-[#222222] mb-3">Condition</h3>
            <div className="space-y-0.5">
              <Link href="/" className="block px-3 py-2 rounded-lg text-sm transition-colors text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]">All Conditions</Link>
              {CONDITIONS.map((c) => <Link key={c.value} href={`/?condition=${c.value}`} className="block px-3 py-2 rounded-lg text-sm transition-colors text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]">{c.label}</Link>)}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="text-sm text-[#6a6a6a]">
              <span className="text-[#222222] font-semibold">{total}</span> listing{total !== 1 ? "s" : ""} found
              {error && <span className="text-[#ff385c] ml-2">(offline mode)</span>}
            </p>
            <form method="get" className="flex items-center gap-2">
              {cat && <input type="hidden" name="category" value={cat} />}
              {cond && <input type="hidden" name="condition" value={cond} />}
              {q && <input type="hidden" name="q" value={q} />}
              <select name="sort" defaultValue={sort} className="airbnb-input text-sm py-1.5 px-3 w-auto">
                {sorts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button type="submit" className="btn-outline text-xs py-1.5 px-4">Apply</button>
            </form>
          </div>

          {loading ? (
            <div className="bg-white rounded-[14px] border border-[#ebebeb] p-12 text-center">
              <p className="text-[#6a6a6a] text-sm">Loading listings...</p>
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="tile-grid">
                {listings.map((l) => {
                  const imgs = (l.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((img) => img.image_url);
                  const p = prof(l.profiles);
                  return <ProductCard key={l.id} id={l.id} title={l.title} price={l.price} condition={l.condition} location={l.location_city} images={imgs.length > 0 ? imgs : null} isNegotiable={l.is_negotiable} isFeatured={l.featured} viewCount={l.views} createdAt={l.created_at} sellerName={p.store_name || p.full_name} sellerVerified={p.verified_badge} sellerStoreSlug={p.store_slug} sellerRating={p.rating_avg} />;
                })}
              </div>
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {page > 1 && <Link href={`/?page=${page - 1}${fs ? `&${fs}` : ""}`} className="btn-outline text-xs py-1.5 px-4">Previous</Link>}
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => { const p = Math.max(1, Math.min(page - 2, pages - 4)) + i; return (p > pages || p < 1) ? null : <Link key={p} href={`/?page=${p}${fs ? `&${fs}` : ""}`} className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${p === page ? "bg-[#222222] text-white font-semibold" : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f2f2f2] border border-[#ebebeb]"}`}>{p}</Link>; })}
                  {page < pages && <Link href={`/?page=${page + 1}${fs ? `&${fs}` : ""}`} className="btn-outline text-xs py-1.5 px-4">Next</Link>}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[14px] border border-[#ebebeb] p-12 text-center">
              {error ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(255,56,92,0.06)] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#ff385c]" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-[#222222] text-lg font-medium mb-2">Connection Issue</p>
                  <p className="text-[#6a6a6a] text-sm mb-4">Could not connect to the database. Please check your connection and try again.</p>
                  <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
                </>
              ) : (
                <>
                  <p className="text-[#222222] text-lg font-medium mb-2">No listings found</p>
                  <p className="text-[#6a6a6a] text-sm mb-4">Try adjusting your filters or be the first to list something.</p>
                  <Link href="/sell" className="btn-primary text-sm">Create First Listing</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
