import { getListing } from "@/lib/actions/listings";
import { getListings } from "@/lib/actions/listings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import Image from "next/image";

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Listing not found</h2>
            <Link href="/" className="text-[#ff385c] font-medium">Go back home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { listings: related } = await getListings({
    category: listing.category,
    limit: 5,
  });
  const relatedFiltered = related.filter((l) => l.id !== listing.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Image */}
          <div className="w-full md:w-1/2 lg:w-3/5">
            <div className="card overflow-hidden aspect-[4/3]">
              {listing.images && listing.images.length > 0 ? (
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
                  <svg className="w-16 h-16" style={{ color: "var(--text-muted)", opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {listing.title}
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-[#ff385c] mb-6">
              {formatKES(listing.price)}
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{listing.condition}</span>
              </div>
            </div>

            {listing.description && (
              <div className="border-t py-6" style={{ borderColor: "var(--border-light)" }}>
                <h3 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Description</h3>
                <p className="whitespace-pre-line leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {listing.description}
                </p>
              </div>
            )}

            {listing.seller_name && (
              <div className="border-t py-6" style={{ borderColor: "var(--border-light)" }}>
                <h3 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                    {listing.seller_name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: "var(--text-primary)" }}>{listing.seller_name}</span>
                </div>
                {listing.seller_phone && (
                  <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                    {listing.seller_phone}
                  </p>
                )}
              </div>
            )}

            {/* M-Pesa */}
            <div className="card p-6 mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white" style={{ background: "#00a651" }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Pay via M-Pesa</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Secure direct payment</p>
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "var(--bg-primary)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Buy Goods Till Number</p>
                <p className="text-2xl font-bold tracking-wider" style={{ color: "#00a651" }}>1919000</p>
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Contact the seller after payment to arrange delivery or pickup. Do not pay in advance for unseen items.
              </p>
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedFiltered.length > 0 && (
          <div className="mt-16 pt-8 border-t" style={{ borderColor: "var(--border-light)" }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Similar in {listing.category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {relatedFiltered.map((l) => (
                <ProductCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
