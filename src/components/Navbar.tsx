"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  const user = session?.user ?? null;

  useEffect(() => {
    if (session?.user) {
      setRole((session.user as any).role ?? null);
    } else {
      setRole(null);
    }
  }, [session]);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          Omix Marketplace
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(role === "seller" || role === "admin") && (
                <Link
                  href="/sell"
                  className="hidden sm:inline-flex px-3 py-2 text-sm border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium"
                >
                  + Sell Item
                </Link>
              )}
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
