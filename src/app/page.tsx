import { getListings } from "@/lib/actions/listings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CategoryPills from "@/components/CategoryPills";
import SearchBar from "@/components/SearchBar";

export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const { listings } = await getListings({
    search: params.q,
    category: params.category,
    limit: 40,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="hero-section py-10 md:py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight" style={{ color: "var(--text-primary)" }}>
              Buy and sell in Kericho
            </h1>
            <p className="text-sm md:text-base max-w-xl mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
              The cleanest marketplace for electronics, furniture, vehicles, and services near you.
            </p>
            <SearchBar />
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4">
          <CategoryPills activeCategory={params.category} />

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 pb-12">
              {listings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
              <p className="text-lg font-medium mb-2">No listings found</p>
              <p className="text-sm">Try a different search or category.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
