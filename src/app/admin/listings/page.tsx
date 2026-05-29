import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { approveListing, rejectListing } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/constants";

export default async function AdminListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if ((session.user as any).role !== "admin") redirect("/");

  const products = await prisma.product.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { name: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pending Listings</h1>
      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-xl border flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-sm text-gray-500">by {p.seller?.name} · {p.location}</p>
                <p className="text-emerald-700 font-semibold">{formatPrice(p.price)}</p>
                {p.description && <p className="text-xs text-gray-400 mt-1 truncate">{p.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <form action={approveListing.bind(null, p.id)}>
                  <button className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 cursor-pointer">
                    Approve
                  </button>
                </form>
                <form action={rejectListing.bind(null, p.id)}>
                  <button className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 cursor-pointer">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>No pending listings</p>
        </div>
      )}
    </div>
  );
}
