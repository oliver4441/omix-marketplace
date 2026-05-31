"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import StarRating from "@/components/StarRating";

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
// CHART: Simple SVG bar chart (no library needed)
// =============================================
function MiniBarChart({ data, height = 120 }: { data: number[]; height?: number }) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-4">No data yet</p>;

  const max = Math.max(...data, 1);
  const width = data.length * 36;
  const barWidth = 28;
  const gap = 8;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height + 30} className="mx-auto">
        {data.map((val, i) => {
          const barH = (val / max) * height;
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill="#10b981"
                rx="4"
                opacity={0.8 + (val / max) * 0.2}
              />
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] ||
                  `D${i + 1}`}
              </text>
              {val > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
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
// STAT CARD
// =============================================
function StatCard({
  label,
  value,
  sub,
  icon,
  color = "emerald",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color?: "emerald" | "blue" | "purple" | "amber" | "red";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="bg-white p-5 rounded-xl border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
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

      // Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, store_name, store_slug, rating_avg, rating_count, avatar_url, is_admin")
        .eq("id", userId)
        .single();
      setProfile(profileData);

      // Listings
      const { data: listingData } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, is_primary)")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      setListings(listingData || []);

      // Orders
      const { data: orderData } = await supabase
        .from("orders")
        .select("*, listings(title), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      setOrders(orderData || []);

      // Recent notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, type, title, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications(notifData || []);

      // Generate earnings chart data (last 7 days)
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
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
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

  const totalCommissions = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.commission_cents, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            back, {profile?.full_name || "seller"}! Here&apos;s your store overview.
          </p>
          {profile?.store_slug && (
            <Link
              href={`/store/${profile.store_slug}`}
              className="text-sm text-emerald-600 hover:underline inline-flex items-center gap-1 mt-1"
            >
              🏬 View your store →
            </Link>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/messages"
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            💬 Messages
            {unreadNotifs > 0 && (
              <span className="w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifs}
              </span>
            )}
          </Link>
          <Link
            href="/sell"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            + New Listing
          </Link>
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
            >
              🛡️ Admin
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon="💰"
          label="Total Earned"
          value={formatPrice(totalEarned)}
          color="emerald"
        />
        <StatCard
          icon="💸"
          label="Total Spent"
          value={formatPrice(totalSpent)}
          color="blue"
        />
        <StatCard
          icon="📦"
          label="Active Listings"
          value={activeListings}
          sub={`${soldListings} sold`}
          color="purple"
        />
        <StatCard icon="👁️" label="Total Views" value={totalViews.toLocaleString()} color="amber" />
        <StatCard icon="🛒" label="Orders" value={orders.length} sub={`${pendingOrders} pending`} color="red" />
        <StatCard icon="⭐" label="Rating" value={profile?.rating_avg ? profile.rating_avg.toFixed(1) : "—"} sub={`${profile?.rating_count || 0} reviews`} color="amber" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings Chart */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            📈 Earnings (Last 7 Days)
          </h3>
          <MiniBarChart data={earningsData.map((e) => Math.round(e / 100))} height={120} />
          <p className="text-sm text-gray-500 text-center mt-2">
            Total: {formatPrice(earningsData.reduce((a, b) => a + b, 0))}
          </p>
        </div>

        {/* Rating Card */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            ⭐ Your Rating
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-emerald-700">
                {profile?.rating_avg ? profile.rating_avg.toFixed(1) : "—"}
              </p>
              <StarRating
                rating={profile?.rating_avg || 0}
                size="lg"
                reviewCount={profile?.rating_count}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {profile?.rating_count
                  ? `You've received ${profile.rating_count} review${profile.rating_count !== 1 ? "s" : ""}`
                  : "No reviews yet. Keep selling to earn ratings!"}
              </p>
              {profile?.store_slug && (
                <Link
                  href={`/store/${profile.store_slug}`}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  View public profile →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">My Listings</h2>
              <span className="text-xs text-gray-400">{listings.length} total</span>
            </div>

            {listings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-gray-500 mb-3">No listings yet</p>
                <Link
                  href="/sell"
                  className="text-emerald-600 text-sm font-medium hover:underline"
                >
                  Create your first listing →
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {listings.slice(0, 10).map((l) => (
                  <div key={l.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
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
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{l.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {l.location_city} · 👁️ {l.views}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm text-emerald-700">
                        {formatPrice(l.price)}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          l.status === "active"
                            ? "text-green-600"
                            : l.status === "sold"
                            ? "text-blue-600"
                            : l.status === "pending_review"
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}
                      >
                        {l.status === "active"
                          ? "● Active"
                          : l.status === "sold"
                          ? "● Sold"
                          : l.status === "pending_review"
                          ? "● Pending"
                          : `● ${l.status}`}
                      </span>
                    </div>
                    <Link
                      href={`/listings/${l.id}`}
                      className="text-xs text-emerald-600 hover:underline shrink-0"
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
          <div className="bg-white rounded-xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-sm">Recent Orders</h2>
            </div>
            {orders.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No orders yet
              </div>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {orders.slice(0, 5).map((o) => {
                  const isBuyer = o.buyer_id === userId;
                  return (
                    <div key={o.id} className="p-3 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          isBuyer ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isBuyer ? "🛒" : "💰"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {(o.listings as any)?.title}
                        </p>
                        <p className="text-[10px] text-gray-400">
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
                            ? "bg-green-100 text-green-700"
                            : o.status === "paid"
                            ? "bg-blue-100 text-blue-700"
                            : o.status === "disputed"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
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
          <div className="bg-white rounded-xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-sm">Notifications</h2>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                All caught up! ✨
              </div>
            ) : (
              <div className="divide-y">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 flex items-start gap-2 ${
                      !n.is_read ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="text-[10px] text-gray-400">
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

          {/* Quick Links */}
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/sell"
                className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium text-center hover:bg-emerald-100 transition"
              >
                📝 New Listing
              </Link>
              <Link
                href="/messages"
                className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium text-center hover:bg-blue-100 transition"
              >
                💬 Messages
              </Link>
              <Link
                href="/services"
                className="p-3 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium text-center hover:bg-purple-100 transition"
              >
                🛎️ Services
              </Link>
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium text-center hover:bg-gray-200 transition"
                >
                  🛡️ Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
