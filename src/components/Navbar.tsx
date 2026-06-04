"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="nav">
      <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Omix" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold hidden sm:inline" style={{ color: "#ff385c" }}>
            Omix
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="text-sm font-medium hidden sm:inline"
            style={{ color: "var(--text-secondary)" }}
          >
            About
          </Link>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <div className="toggle-circle">
              <span className="toggle-icon">{theme === "dark" ? "☀" : "🌙"}</span>
            </div>
          </button>

          <Link href="/sell" className="btn-primary text-xs py-2 px-4">
            Sell
          </Link>
        </div>
      </div>
    </nav>
  );
}
