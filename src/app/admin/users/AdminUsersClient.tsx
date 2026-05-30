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
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Rating</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-left p-3">Actions</th>
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
      <tr className="border-t">
        <td className="p-3 font-medium">{user.full_name || "—"}</td>
        <td className="p-3">{user.email}</td>
        <td className="p-3">{user.phone || "—"}</td>
        <td className="p-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === "admin" ? "bg-red-100 text-red-700" :
            user.role === "seller" ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {user.role}
          </span>
        </td>
        <td className="p-3">
          {user.rating_count && user.rating_count > 0
            ? `⭐ ${user.rating_avg} (${user.rating_count})`
            : "—"}
        </td>
        <td className="p-3">
          {user.verified_badge ? (
            <span className="text-emerald-600">✓</span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </td>
        <td className="p-3 text-xs text-gray-500">
          {new Date(user.created_at).toLocaleDateString()}
        </td>
        <td className="p-3">
          {user.role === "seller" && !user.verified_badge && (
            <button
              onClick={handleVerify}
              className="text-xs px-2 py-1 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700"
            >
              Verify
            </button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={8} className="p-2">
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded">
              {error}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
