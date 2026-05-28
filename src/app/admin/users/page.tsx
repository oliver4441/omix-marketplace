import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { verifySeller } from "@/lib/actions/admin";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

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
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.full_name}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{u.role}</span>
                </td>
                <td className="p-3 text-center">{u.is_verified ? "✅" : "❌"}</td>
                <td className="p-3">
                  {u.role === "seller" && !u.is_verified && (
                    <form action={verifySeller.bind(null, u.id)}>
                      <button className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium">Verify Seller</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
