import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;

  const where: any = { status: "active" };
  if (params.q) {
    where.title = { contains: params.q, mode: "insensitive" };
  }
  if (params.category) {
    const cat = CATEGORIES.find((c) => c.slug === params.category);
    if (cat) where.categoryId = cat.id;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-emerald-700 text-white rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold">Buy & Sell in Kericho</h1>
        <p className="mt-2 text-emerald-100">
          The trusted marketplace. Omix handles delivery for every order.
        </p>
        <form className="mt-4 max-w-xl flex gap-2" method="get">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search products..."
            className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-white text-emerald-700 rounded-lg font-medium hover:bg-emerald-50"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <h2 className="font-semibold mb-3">Categories</h2>
          <div className="space-y-1">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm ${
                !params.category
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              All Categories
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  params.category === cat.slug
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-4">
            {products.length} items found
          </p>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  condition={product.condition}
                  location={product.location}
                  images={product.images}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🏪</p>
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Be the first to list something!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
