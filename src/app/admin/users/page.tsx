import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { verifySeller } from "@/lib/actions/admin";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if ((session.user as any).role !== "admin") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.phone ?? "—"}</td>
                <td className="p-3">{u.email ?? "—"}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{u.role}</span>
                </td>
                <td className="p-3">
                  {u.isVerified ? (
                    <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Not verified</span>
                  )}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {u.createdAt.toLocaleDateString("en-KE")}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">No users yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
