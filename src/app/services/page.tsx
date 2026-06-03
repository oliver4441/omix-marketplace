"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price_cents: number;
  price_type: string;
  location_city: string;
  is_remote: boolean;
  rating_avg: number;
  rating_count: number;
  provider: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    store_slug: string | null;
    store_name: string | null;
    verified_badge: boolean;
  }[] | {
    id: string;
    full_name: string;
    avatar_url: string | null;
    store_slug: string | null;
    store_name: string | null;
    verified_badge: boolean;
  };
}

const SERVICE_CATEGORIES = [
  "All",
  "Tech & IT",
  "Design & Creative",
  "Writing & Translation",
  "Marketing",
  "Business Consulting",
  "Tutoring",
  "Home Services",
  "Beauty & Wellness",
  "Photography",
  "Other",
];

export default function ServicesPage() {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    let query = supabase
      .from("business_services")
      .select(
        "id, title, description, category, price_cents, price_type, location_city, is_remote, rating_avg, rating_count, provider:profiles!business_services_provider_id_fkey(id, full_name, avatar_url, store_slug, store_name, verified_badge)"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category !== "All") {
      query = query.eq("category", category);
    }

    const { data } = await query;
    setServices((data as any[]) || []);
    setLoading(false);
  }, [supabase, search, category]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Business Services</h1>
        <p className="text-slate-400 text-sm mt-1">Find skilled professionals for any task</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="flex-1 glass-input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="glass-input"
        >
          {SERVICE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      {!loading && services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.id}`}>
              <div className="glass-card p-5 hover:border-emerald-500/30 cursor-pointer h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    {(Array.isArray(service.provider) ? service.provider[0]?.full_name?.[0] : service.provider?.full_name?.[0]) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)]">{(Array.isArray(service.provider) ? service.provider[0]?.store_name || service.provider[0]?.full_name : service.provider?.store_name || service.provider?.full_name) || "Service Provider"}</p>
                    {(Array.isArray(service.provider) ? service.provider[0]?.verified_badge : service.provider?.verified_badge) && (
                      <p className="text-xs text-emerald-400">✓ Verified</p>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-base mb-1 text-[var(--text-primary)]">{service.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{service.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-emerald-400">{formatPrice(service.price_cents)}</span>
                    <span className="text-xs text-slate-500 ml-1">
                      {service.price_type === "hourly" ? "/hr" : service.price_type === "negotiable" ? " ~" : ""}
                    </span>
                  </div>
                  {service.is_remote && (
                    <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded-full">Remote</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  {service.location_city && <span>Location: {service.location_city}</span>}
                  {service.rating_count > 0 && (
                    <span>Rating: {service.rating_avg.toFixed(1)} ({service.rating_count})</span>
                  )}
                </div>
                <span className="inline-block mt-2 text-xs bg-white/10 text-slate-300 px-2 py-1 rounded-full">
                  {service.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-16 h-16 rounded-2xl var(--bg-hover) flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.25h3M12 17.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="font-medium text-[var(--text-primary)]">No services found</p>
          <p className="text-sm text-slate-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <p>Loading services...</p>
        </div>
      )}
    </div>
  );
}
