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
      setMessage("Password updated! Redirecting...");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">New password</h1>
          <p className="text-slate-400 mt-1">Enter your new password below</p>
        </div>

        {status === "success" ? (
          <div className="bg-green-50 text-green-400 p-4 rounded-xl text-sm border border-green-200 text-center">
            <p className="font-medium">✅ Password updated</p>
            <p className="mt-1">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 glass-card p-6 rounded-xl shadow-sm border">
            {status === "error" && (
              <div className="bg-red-50 text-red-400 p-3 rounded-lg text-sm border border-red-200">
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={status === "saving" || !password || !confirm}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {status === "saving" ? "Updating..." : "Update Password"}
            </button>
            <p className="text-sm text-center text-slate-400">
              <Link href="/auth/login" className="text-emerald-600 font-medium">
                ← Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
