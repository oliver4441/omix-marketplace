"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  store_slug: string | null;
  unread_count?: number;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, is_admin, store_slug")
      .eq("id", uid)
      .single();
    setProfile(data as ProfileData);
  }, [supabase]);

  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("conversation_members")
      .select("unread_count", { count: "exact" })
      .eq("user_id", uid);
    const total = (data as any[])?.reduce((sum, r) => sum + (r.unread_count || 0), 0) || 0;
    setUnreadCount(total);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
        fetchUnreadCount(user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUnreadCount(session.user.id);
      } else {
        setProfile(null);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchUnreadCount]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <span className="text-xl font-bold text-emerald-700">Omix</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Omix" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-emerald-700 hidden sm:inline">Omix</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/messages" className="relative px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                💬 Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/ai-assistant" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                ✨ AI Help
              </Link>
              <Link href="/services" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                🛠 Services
              </Link>
            </div>
          )}
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/sell" className="px-3 py-2 text-sm border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium">
                + Sell Item
              </Link>
              {profile?.is_admin && (
                <Link href="/admin" className="px-3 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 font-medium">
                  Admin
                </Link>
              )}
              {profile?.store_slug && (
                <Link href={`/store/${profile.store_slug}`} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                  My Store
                </Link>
              )}
              <Link href="/dashboard" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                Dashboard
              </Link>
              <Link href="/verify" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
                Verify
              </Link>
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 cursor-pointer">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link href="/sell" className="flex items-center gap-2 px-3 py-2.5 text-sm text-emerald-700 font-medium rounded-lg hover:bg-emerald-50">
                  ➕ Sell Item
                </Link>
                <Link href="/messages" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  💬 Messages
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/ai-assistant" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  ✨ AI Help
                </Link>
                <Link href="/services" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  🛠 Services
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  📊 Dashboard
                </Link>
                <Link href="/verify" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  ✅ Verify
                </Link>
                {profile?.store_slug && (
                  <Link href={`/store/${profile.store_slug}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                    🏪 My Store
                  </Link>
                )}
                {profile?.is_admin && (
                  <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50">
                    🔐 Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                  Sign In
                </Link>
                <Link href="/auth/register" className="flex items-center gap-2 px-3 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium justify-center">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
