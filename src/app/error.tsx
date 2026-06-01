"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md glass-card p-8">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 glass-btn rounded-xl font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2 glass-btn-outline rounded-xl font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
