"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import StarRating from "@/components/StarRating";
import OmixAiChatPopup from "@/components/OmixAiChatPopup";

interface DashboardProfile {
  id: string;
  full_name: string | null;
  store_name: string | null;
  store_slug: string | null;
  rating_avg: number;
  rating_count: number;
  avatar_url: string | null;
  is_admin: boolean;
}

interface ListingRow {
  id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  created_at: string;
  location_city: string;
  listing_images: { image_url: string; is_primary: boolean }[];
}

interface OrderRow {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  amount_cents: number;
  commission_cents: number;
  seller_earns_cents: number;
  status: string;
  created_at: string;
  listings: { title: string };
  buyer: { full_name: string };
  seller: { full_name: string };
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  is_read: boolean;
  created_at: string;
}

// =============================================
// CHART: Simple SVG bar chart
// =============================================
function MiniBarChart({ data, height = 120 }: { data: number[]; height?: number }) {
  if (!data.length) return <p className="text-sm text-slate-400 text-center py-4">No data yet</p>;

  const max = Math.max(...data, 1);
  const barWidth = 28;
  const gap = 8;
  const width = data.length * (barWidth + gap) + gap;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height + 30} className="mx-auto">
        {data.map((val, i) => {
          const barH = (val / max) * height;
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barH;
          return (
            <g key={i}>
              <defs>
                <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH || 2}
                fill={`url(#barGrad${i})`}
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] || `D${i + 1}`}
              </text>
              {val > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {val}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// =============================================
// STAT CARD — dark glass
// =============================================
function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: "emerald" | "blue" | "purple" | "amber" | "red";
}) {
  const gradients: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-60/5 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-60/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-60/5 border-purple-500/20",
    amber: "from-amber-500/20 to-amber-60/5 border-amber-500/20",
    red: "from-red-500/20 to-red-60/5 border-red-500/20",
  };
  const iconBg: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    blue: "bg-blue-500/15 text-blue-400",
    purple: "bg-purple-500/15 text-purple-400",
    amber: "bg-amber-500/15 text-amber-400",
    red: "bg-red-500/15 text-red-400",
  };
  const valueColor: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[accent]} border rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-3 ${iconBg[accent]}`}>
        {icon}
      </div>
      <p className={`text-xl font-bold ${valueColor[accent]}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// =============================================
// LIVE BACKGROUND (shared component)
// =============================================
function LiveBackground() {
  return (
    <>
      {/* Mesh gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #10b981, transparent 70%)",
            top: "-10%",
            left: "-5%",
            animation: "blobPulse 12s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #3b82f6, transparent 70%)",
            bottom: "-10%",
            right: "-5%",
            animation: "blobPulse 15s ease-in-out infinite alternate-reverse",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.02]"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
            top: "40%",
            left: "50%",
            animation: "blobPulse 18s ease-in-out infinite alternate",
          }}
        />
      </div>
      {/* Floating particles - fixed positions to avoid hydration mismatch */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: '3px', height: '3px', background: '#10b981', opacity: 0.12, left: '5%', bottom: '-5%', animation: 'particleFloat 18s linear infinite', animationDelay: '0s' }} />
        <div className="absolute rounded-full" style={{ width: '2px', height: '2px', background: '#3b82f6', opacity: 0.1, left: '15%', bottom: '-5%', animation: 'particleFloat 22s linear infinite', animationDelay: '3s' }} />
        <div className="absolute rounded-full" style={{ width: '4px', height: '4px', background: '#8b5cf6', opacity: 0.08, left: '30%', bottom: '-5%', animation: 'particleFloat 25s linear infinite', animationDelay: '7s' }} />
        <div className="absolute rounded-full" style={{ width: '2px', height: '2px', background: '#10b981', opacity: 0.14, left: '45%', bottom: '-5%', animation: 'particleFloat 20s linear infinite', animationDelay: '12s' }} />
        <div className="absolute rounded-full" style={{ width: '3px', height: '3px', background: '#3b82f6', opacity: 0.1, left: '60%', bottom: '-5%', animation: 'particleFloat 28s linear infinite', animationDelay: '5s' }} />
        <div className="absolute rounded-full" style={{ width: '2px', height: '2px', background: '#8b5cf6', opacity: 0.12, left: '75%', bottom: '-5%', animation: 'particleFloat 17s linear infinite', animationDelay: '9s' }} />
        <div className="absolute rounded-full" style={{ width: '3px', height: '3px', background: '#10b981', opacity: 0.09, left: '88%', bottom: '-5%', animation: 'particleFloat 24s linear infinite', animationDelay: '15s' }} />
        <div className="absolute rounded-full" style={{ width: '2px', height: '2px', background: '#3b82f6', opacity: 0.11, left: '22%', bottom: '-5%', animation: 'particleFloat 19s linear infinite', animationDelay: '2s' }} />
        <div className="absolute rounded-full" style={{ width: '4px', height: '4px', background: '#8b5cf6', opacity: 0.07, left: '52%', bottom: '-5%', animation: 'particleFloat 26s linear infinite', animationDelay: '11s' }} />
        <div className="absolute rounded-full" style={{ width: '2px', height: '2px', background: '#10b981', opacity: 0.13, left: '95%', bottom: '-5%', animation: 'particleFloat 21s linear infinite', animationDelay: '18s' }} />
      </div>
    </>
  );
}

// =============================================
// MAIN DASHBOARD
// =============================================
export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<number[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
    });
  }, [supabase, router]);

  useEffect(() => {
    if (!userId) return;

    async function loadDashboard() {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, store_name, store_slug, rating_avg, rating_count, avatar_url, is_admin")
        .eq("id", userId)
        .single();
      setProfile(profileData);

      const { data: listingData } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, is_primary)")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      setListings(listingData || []);

      const { data: orderData } = await supabase
        .from("orders")
        .select("*, listings(title), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      setOrders(orderData || []);

      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, type, title, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications(notifData || []);

      const completedSales = (orderData || []).filter(
        (o: OrderRow) => o.status === "completed" && o.seller_id === userId
      );
      const dailyEarnings = Array(7).fill(0);
      completedSales.forEach((o: OrderRow) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysAgo < 7 && daysAgo >= 0) {
          dailyEarnings[6 - daysAgo] += o.seller_earns_cents;
        }
      });
      setEarningsData(dailyEarnings);

      setLoading(false);
    }

    loadDashboard();
  }, [userId, supabase]);

  if (loading) {
    return (
      <div className="min-h-[70vh] relative flex items-center justify-center">
        <LiveBackground />
        <div className="relative z-10 text-center">
          <div className="inline-block w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalEarned = orders
    .filter((o) => o.status === "completed" && o.seller_id === userId)
    .reduce((sum, o) => sum + o.seller_earns_cents, 0);

  const totalSpent = orders
    .filter((o) => o.status === "completed" && o.buyer_id === userId)
    .reduce((sum, o) => sum + o.amount_cents, 0);

  const activeListings = listings.filter((l) => l.status === "active").length;
  const soldListings = listings.filter((l) => l.status === "sold").length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" && o.seller_id === userId).length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="page-enter relative z-10">
      <LiveBackground />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, {profile?.full_name || "seller"}! Here&apos;s your store overview.
            </p>
            {profile?.store_slug && (
              <Link
                href={`/store/${profile.store_slug}`}
                className="text-sm text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 mt-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                View your store
              </Link>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/messages"
              className="glass-btn-outline py-2 px-4 text-xs flex items-center gap-2"
            >
              <svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Messages
              {unreadNotifs > 0 && (
                <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </Link>
            <Link
              href="/sell"
              className="glass-btn py-2 px-4 text-xs flex items-center gap-2"
            >
              <svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Listing
            </Link>
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors border border-white/10"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard
            icon={<svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Total Earned"
            value={formatPrice(totalEarned)}
            accent="emerald"
          />
          <StatCard
            icon={<svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3m18 0v-.375c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-.75M3 12h18M3 6h18" /></svg>}
            label="Total Spent"
            value={formatPrice(totalSpent)}
            accent="blue"
          />
          <StatCard
            icon={<svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.25h3M12 17.25h.008v.008H12v-.008z" /></svg>}
            label="Active Listings"
            value={activeListings}
            sub={`${soldListings} sold`}
            accent="purple"
          />
          <StatCard
            icon={<svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Total Views"
            value={totalViews.toLocaleString()}
            accent="amber"
          />
          <StatCard
            icon={<svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>}
            label="Orders"
            value={orders.length}
            sub={`${pendingOrders} pending`}
            accent="red"
          />
          <StatCard
            icon={<svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
            label="Rating"
            value={profile?.rating_avg ? profile.rating_avg.toFixed(1) : "—"}
            sub={`${profile?.rating_count || 0} reviews`}
            accent="amber"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
              Earnings (Last 7 Days)
            </h3>
            <MiniBarChart data={earningsData.map((e) => Math.round(e / 100))} height={120} />
            <p className="text-sm text-slate-500 text-center mt-2">
              Total: {formatPrice(earningsData.reduce((a, b) => a + b, 0))}
            </p>
          </div>

          {/* Rating Card */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              Your Rating
            </h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-emerald-400">
                  {profile?.rating_avg ? profile.rating_avg.toFixed(1) : "—"}
                </p>
                <StarRating
                  rating={profile?.rating_avg || 0}
                  size="lg"
                  reviewCount={profile?.rating_count}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-400">
                  {profile?.rating_count
                    ? `You've received ${profile.rating_count} review${profile.rating_count !== 1 ? "s" : ""}`
                    : "No reviews yet. Keep selling to earn ratings!"}
                </p>
                {profile?.store_slug && (
                  <Link
                    href={`/store/${profile.store_slug}`}
                    className="text-sm text-emerald-400 hover:text-emerald-300 mt-2 inline-flex items-center gap-1 transition-colors"
                  >
                    View public profile
                    <svg className="w-3.5 h-3.5" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Listings */}
          <div className="lg:col-span-2">
            <div className="glass-card">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="font-semibold text-sm text-white">My Listings</h2>
                <span className="text-xs text-slate-500">{listings.length} total</span>
              </div>

              {listings.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M8.25 3.25h.008v.008H8.25V-.25z" /></svg>
                  <p className="text-slate-400 mb-3">No listings yet</p>
                  <Link href="/sell" className="glass-btn text-xs">Create your first listing</Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {listings.slice(0, 10).map((l) => (
                    <div key={l.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/5">
                        {l.listing_images?.find((i) => i.is_primary)?.image_url ||
                         l.listing_images?.[0]?.image_url ? (
                          <img
                            src={
                              l.listing_images.find((i) => i.is_primary)?.image_url ||
                              l.listing_images[0].image_url
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-600" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M8.25 3.25h.008v.008H8.25V-.25z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-200 truncate">{l.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {l.location_city} · {l.views} views
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-emerald-400">
                          {formatPrice(l.price)}
                        </p>
                        <span
                          className={`text-xs font-medium ${
                            l.status === "active"
                              ? "text-emerald-400"
                              : l.status === "sold"
                              ? "text-blue-400"
                              : l.status === "pending_review"
                              ? "text-amber-400"
                              : "text-slate-500"
                          }`}
                        >
                          {l.status === "active"
                            ? "Active"
                            : l.status === "sold"
                            ? "Sold"
                            : l.status === "pending_review"
                            ? "Pending"
                            : l.status}
                        </span>
                      </div>
                      <Link
                        href={`/listings/${l.id}`}
                        className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Orders + Notifications */}
          <div className="space-y-6">
            {/* Recent Orders */}
            <div className="glass-card">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="font-semibold text-sm text-white">Recent Orders</h2>
              </div>
              {orders.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No orders yet
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                  {orders.slice(0, 5).map((o) => {
                    const isBuyer = o.buyer_id === userId;
                    return (
                      <div key={o.id} className="p-3 flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            isBuyer ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {isBuyer ? (
                            <svg className="w-3.5 h-3.5" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300 truncate">
                            {(o.listings as any)?.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {isBuyer ? "Purchased" : "Sold"} ·{" "}
                            {new Date(o.created_at).toLocaleDateString("en-KE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            o.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : o.status === "paid"
                              ? "bg-blue-500/15 text-blue-400"
                              : o.status === "disputed"
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="glass-card">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="font-semibold text-sm text-white">Notifications</h2>
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  All caught up!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 flex items-start gap-2 ${
                        !n.is_read ? "bg-emerald-500/[0.03]" : ""
                      }`}
                    >
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-300">{n.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(n.created_at).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-4">
              <h2 className="font-semibold text-sm text-white mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/sell"
                  className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-medium text-center hover:bg-emerald-500/20 transition-colors border border-emerald-500/10"
                >
                  New Listing
                </Link>
                <Link
                  href="/messages"
                  className="p-3 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-medium text-center hover:bg-blue-500/20 transition-colors border border-blue-500/10"
                >
                  Messages
                </Link>
                <Link
                  href="/services"
                  className="p-3 bg-purple-500/10 text-purple-400 rounded-xl text-xs font-medium text-center hover:bg-purple-500/20 transition-colors border border-purple-500/10"
                >
                  Services
                </Link>
                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    className="p-3 bg-slate-500/10 text-slate-400 rounded-xl text-xs font-medium text-center hover:bg-slate-500/20 transition-colors border border-slate-500/10"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Omix-AI Seller Assistant */}
        <OmixAiChatPopup
          role="seller"
          context={`Seller dashboard - Active listings: ${activeListings} - Sold: ${soldListings} - Total views: ${totalViews} - Orders: ${orders.length} - Rating: ${profile?.rating_avg ? profile.rating_avg.toFixed(1) : "No rating yet"} - Store: ${profile?.store_name || "Not set up"}`}
        />
      </div>
    </div>
  );
}
