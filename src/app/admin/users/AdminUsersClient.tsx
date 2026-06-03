"use client";

import { useState } from "react";
import { verifySeller } from "@/lib/actions/admin";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  rating_avg: number | null;
  rating_count: number | null;
  verified_badge: boolean | null;
  created_at: string;
}

export default function AdminUsersClient({ users }: { users: UserRow[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">User Management</h1>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-slate-400 font-medium">Name</th>
              <th className="text-left p-3 text-slate-400 font-medium">Email</th>
              <th className="text-left p-3 text-slate-400 font-medium">Phone</th>
              <th className="text-left p-3 text-slate-400 font-medium">Role</th>
              <th className="text-left p-3 text-slate-400 font-medium">Rating</th>
              <th className="text-left p-3 text-slate-400 font-medium">Verified</th>
              <th className="text-left p-3 text-slate-400 font-medium">Joined</th>
              <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRowItem key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRowItem({ user }: { user: UserRow }) {
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    const result = await verifySeller(user.id);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      window.location.reload();
    }
  }

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
        <td className="p-3 font-medium text-slate-200">{user.full_name || "—"}</td>
        <td className="p-3 text-slate-400">{user.email}</td>
        <td className="p-3 text-slate-400">{user.phone || "—"}</td>
        <td className="p-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === "admin" ? "bg-red-500/15 text-red-400" :
            user.role === "seller" ? "bg-blue-500/15 text-blue-400" :
            "bg-slate-500/15 text-slate-400"
          }`}>
            {user.role}
          </span>
        </td>
        <td className="p-3 text-slate-400">
          {user.rating_count && user.rating_count > 0
            ? `${user.rating_avg} (${user.rating_count})`
            : "—"}
        </td>
        <td className="p-3">
          {user.verified_badge ? (
            <span className="text-emerald-400">Verified</span>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </td>
        <td className="p-3 text-xs text-slate-500">
          {new Date(user.created_at).toLocaleDateString()}
        </td>
        <td className="p-3">
          {user.role === "seller" && !user.verified_badge && (
            <button
              onClick={handleVerify}
              className="text-xs px-2 py-1 glass-btn rounded cursor-pointer"
            >
              Verify
            </button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={8} className="p-2">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded">
              {error}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
