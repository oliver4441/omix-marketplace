"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) { setStatus("error"); setMessage(error.message); }
    else { setStatus("sent"); setMessage("Check your email for a password reset link."); }
  }

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Reset password</h1>
          <p className="text-[var(--text-secondary)] mt-1">Enter your email and we will send you a reset link</p>
        </div>

        {status === "sent" ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[rgba(39,166,68,0.06)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#27a644]" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="font-medium text-[#27a644]">Check your email</p>
            <p className="mt-1 text-[var(--text-secondary)] text-sm">{message}</p>
            <Link href="/auth/login" className="inline-block mt-4 text-[#ff385c] hover:text-[#e00b41] text-sm font-medium">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-6 space-y-4">
            {status === "error" && <div className="bg-[rgba(255,56,92,0.06)] border border-[rgba(255,56,92,0.15)] text-[#ff385c] p-3 rounded-xl text-sm">{message}</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="airbnb-input" />
            </div>
            <button type="submit" disabled={status === "sending" || !email.trim()} className="w-full py-2.5 btn-primary rounded-xl font-medium disabled:opacity-50">
              {status === "sending" ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-sm text-center"><Link href="/auth/login" className="text-[#ff385c] hover:text-[#e00b41] font-medium">Back to sign in</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
