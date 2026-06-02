"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md glass-card p-8">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-6 py-2 glass-btn rounded-xl font-medium">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
