export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";

export default async function AdminPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  let activeListings = 0, pendingListings = 0, totalOrders = 0, totalUsers = 0, openDisputes = 0, recentOrders: any[] = [];

  try {
    const [
      { count: activeListingsCount },
      { count: pendingListingsCount },
      { count: totalOrdersCount },
      { count: totalUsersCount },
      { count: openDisputesCount },
      { data: recentOrdersData },
    ] = await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase
        .from("orders")
        .select("id, status, amount_cents, listings(title), profiles!orders_buyer_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    activeListings = activeListingsCount ?? 0;
    pendingListings = pendingListingsCount ?? 0;
    totalOrders = totalOrdersCount ?? 0;
    totalUsers = totalUsersCount ?? 0;
    openDisputes = openDisputesCount ?? 0;
    recentOrders = recentOrdersData ?? [];
  } catch (err) {
    console.error("Admin dashboard error:", err);
  }

  const statCards = [
    { label: "Active Listings", value: activeListings ?? 0, href: "/admin/listings", color: "emerald" },
    { label: "Pending Review", value: pendingListings ?? 0, href: null, color: "amber" },
    { label: "Total Orders", value: totalOrders ?? 0, href: "/admin/orders", color: "blue" },
    { label: "Total Users", value: totalUsers ?? 0, href: "/admin/users", color: "purple" },
    { label: "Open Disputes", value: openDisputes ?? 0, href: "/admin/disputes", color: "red" },
  ];

  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400",
    red: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const content = (
            <div className={`bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-5 transition-all hover:scale-[1.02]`}>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className={`text-3xl font-bold ${colorMap[card.color].split(" ").pop()}`}>{card.value}</p>
            </div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href}>{content}</Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold mb-4 text-white">Recent Orders</h2>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-slate-400 font-medium">Listing</th>
              <th className="text-left p-3 text-slate-400 font-medium">Buyer</th>
              <th className="text-left p-3 text-slate-400 font-medium">Amount</th>
              <th className="text-left p-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders?.map((order: any) => (
              <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-3 text-slate-300">{(order.listings as any)?.title ?? "—"}</td>
                <td className="p-3 text-slate-300">{(order.profiles as any)?.full_name ?? "—"}</td>
                <td className="p-3 text-slate-300">{formatPrice(order.amount_cents)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                    order.status === "paid" ? "bg-blue-500/15 text-blue-400" :
                    order.status === "cancelled" || order.status === "refunded" ? "bg-red-500/15 text-red-400" :
                    "bg-amber-500/15 text-amber-400"
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
