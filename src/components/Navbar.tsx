"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "@/components/ThemeProvider";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  store_slug: string | null;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, is_admin, store_slug").eq("id", uid).single();
    setProfile(data as ProfileData);
  }, [supabase]);

  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { data } = await supabase.from("conversation_members").select("unread_count");
    const total = (data as { unread_count: number }[])?.reduce((sum, r) => sum + (r.unread_count || 0), 0) || 0;
    setUnreadCount(total);
  }, [supabase]);

  const fetchCartCount = useCallback(async (uid: string) => {
    const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", uid);
    setCartCount(count || 0);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) { fetchProfile(u.id).catch(() => {}); fetchUnreadCount(u.id).catch(() => {}); fetchCartCount(u.id).catch(() => {}); }
      setLoading(false);
    }).catch(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) { fetchProfile(u.id).catch(() => {}); fetchUnreadCount(u.id).catch(() => {}); fetchCartCount(u.id).catch(() => {}); }
      else { setProfile(null); setUnreadCount(0); setCartCount(0); }
    });
    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchUnreadCount, fetchCartCount]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const navItem = "px-3 py-2 text-sm font-medium rounded-lg transition-colors";
  const navOff = "hover:opacity-80";

  return (
    <nav className="nav-airbnb">
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="Omix" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold hidden sm:inline" style={{ color: "var(--text-primary)" }}>Omix</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/cart" className={`relative ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>
                Cart
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-[#ff385c] text-[var(--text-primary)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount > 9 ? "9+" : cartCount}</span>}
              </Link>
              <Link href="/messages" className={`relative ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>
                Messages
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-[#ff385c] text-[var(--text-primary)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
              <Link href="/orders" className={`${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Orders</Link>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="toggle-circle">
              <span className="toggle-icon">{theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}</span>
            </div>
          </button>

          {user ? (
            <>
              <Link href="/sell" className="btn-outline py-1.5 px-4 text-xs">Sell</Link>
              {profile?.store_slug && (
                <Link href={`/store/${profile.store_slug}`} className={`${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>My Store</Link>
              )}
              <Link href="/dashboard" className={`${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
              {profile?.is_admin && <Link href="/admin" className={`${navItem}`} style={{ color: "#ff385c" }}>Admin</Link>}
              <button onClick={handleLogout} className={`${navItem} ${navOff} cursor-pointer`} style={{ color: "var(--text-secondary)" }}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={`${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Sign In</Link>
              <Link href="/auth/register" className="btn-primary py-1.5 px-4 text-xs">Register</Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          {/* Mobile theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="toggle-circle">
              <span className="toggle-icon">{theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}</span>
            </div>
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:opacity-80" style={{ color: "var(--text-secondary)" }} aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t" style={{ borderColor: "var(--border-light)", background: "var(--bg-primary)" }}>
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link href="/sell" className={`block ${navItem}`} style={{ color: "#ff385c" }}>Sell Item</Link>
                <Link href="/cart" className={`block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Cart {cartCount > 0 && <span className="ml-1 badge badge-accent">{cartCount}</span>}</Link>
                <Link href="/messages" className={`block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Messages {unreadCount > 0 && <span className="ml-1 badge" style={{ background: "rgba(255,56,92,0.1)", color: "#ff385c" }}>{unreadCount}</span>}</Link>
                <Link href="/orders" className={`block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Orders</Link>
                <Link href="/dashboard" className={`block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
                {profile?.store_slug && <Link href={`/store/${profile.store_slug}`} className={`block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>My Store</Link>}
                {profile?.is_admin && <Link href="/admin" className={`block ${navItem}`} style={{ color: "#ff385c" }}>Admin</Link>}
                <button onClick={handleLogout} className={`w-full text-left block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className={`block ${navItem} ${navOff}`} style={{ color: "var(--text-secondary)" }}>Sign In</Link>
                <Link href="/auth/register" className="btn-primary text-xs w-full justify-center mt-2">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
