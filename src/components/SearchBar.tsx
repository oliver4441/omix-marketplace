"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search for anything..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input pl-12 pr-4 py-4 rounded-[14px]"
        style={{
          boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
        }}
      />
    </form>
  );
}
