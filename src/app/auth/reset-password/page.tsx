"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    setStatus("saving");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage("Password updated. Redirecting...");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">New password</h1>
          <p className="text-slate-400 mt-1">Enter your new password below</p>
        </div>

        {status === "success" ? (
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium text-emerald-400">Password updated</p>
            <p className="mt-1 text-slate-400 text-sm">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            {status === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                {message}
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="glass-input"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="glass-input"
              />
            </div>
            <button
              type="submit"
              disabled={status === "saving" || !password || !confirm}
              className="w-full py-2.5 glass-btn rounded-xl font-medium disabled:opacity-50"
            >
              {status === "saving" ? "Updating..." : "Update Password"}
            </button>
            <p className="text-sm text-center">
              <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
