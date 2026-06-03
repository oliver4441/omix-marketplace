export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";

interface RecentOrder {
  id: string;
  status: string;
  amount_cents: number;
  listings: { title: string }[] | null;
  profiles: { full_name: string }[] | null;
}

export default async function AdminPage() {
  const { createClient: createServerClient } = await import("@/utils/supabase/server");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  let activeListings = 0, pendingListings = 0, totalOrders = 0, totalUsers = 0, openDisputes = 0;
  let recentOrders: RecentOrder[] = [];

  try {
    const [
      { count: activeListingsCount }, { count: pendingListingsCount }, { count: totalOrdersCount },
      { count: totalUsersCount }, { count: openDisputesCount }, { data: recentOrdersData },
    ] = await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("orders").select("id, status, amount_cents, listings(title), profiles!orders_buyer_id_fkey(full_name)").order("created_at", { ascending: false }).limit(5),
    ]);
    activeListings = activeListingsCount ?? 0;
    pendingListings = pendingListingsCount ?? 0;
    totalOrders = totalOrdersCount ?? 0;
    totalUsers = totalUsersCount ?? 0;
    openDisputes = openDisputesCount ?? 0;
    recentOrders = (recentOrdersData || []) as unknown as RecentOrder[];
  } catch (err) {
    console.error("Admin dashboard error:", err);
  }

  const statCards = [
    { label: "Active Listings", value: activeListings, href: "/admin/listings", color: "#27a644" },
    { label: "Pending Review", value: pendingListings, href: null, color: "#f59e0b" },
    { label: "Total Orders", value: totalOrders, href: "/admin/orders", color: "#3b82f6" },
    { label: "Total Users", value: totalUsers, href: "/admin/users", color: "#8b5cf6" },
    { label: "Open Disputes", value: openDisputes, href: "/admin/disputes", color: "#ef4444" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const content = (
            <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-5 hover:shadow-md" style={{ borderBottom: `3px solid ${card.color}` }}>
              <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            </div>
          );
          return card.href ? <Link key={card.label} href={card.href}>{content}</Link> : <div key={card.label}>{content}</div>;
        })}
      </div>

      <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Recent Orders</h2>
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-light)]">
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Listing</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Buyer</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Amount</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders?.map((order) => (
              <tr key={order.id} className="border-b border-[#f2f2f2] hover:bg-[var(--bg-secondary)]">
                <td className="p-3 text-[var(--text-primary)]">{((order.listings as unknown as { title: string }[])?.[0]?.title) ?? "—"}</td>
                <td className="p-3 text-[var(--text-primary)]">{((order.profiles as unknown as { full_name: string }[])?.[0]?.full_name) ?? "—"}</td>
                <td className="p-3 text-[var(--text-primary)]">{formatPrice(order.amount_cents)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "completed" ? "bg-[rgba(39,166,68,0.08)] text-[#27a644]" :
                    order.status === "paid" ? "bg-[rgba(59,130,246,0.08)] text-[#3b82f6]" :
                    order.status === "cancelled" || order.status === "refunded" ? "bg-[rgba(239,68,68,0.08)] text-[#ef4444]" :
                    "bg-[rgba(245,158,11,0.08)] text-[#f59e0b]"
                  }`}>{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
