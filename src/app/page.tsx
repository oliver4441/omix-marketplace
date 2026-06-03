import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import ListingsSection from "./ListingsSection";

export default function HomePage() {
  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="hero-airbnb pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[rgba(255,56,92,0.06)] border border-[rgba(255,56,92,0.15)] rounded-full px-4 py-1.5 mb-5">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff385c] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff385c]" /></span>
              <span className="text-[#ff385c] text-xs font-medium">Trusted marketplace in Kenya</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#222222] leading-tight tracking-tight">
              Buy & Sell.<br />
              <span className="text-[#ff385c]">Simple & Secure.</span>
            </h1>
            <p className="mt-3 text-[#6a6a6a] text-sm md:text-base max-w-xl mx-auto">The leading P2P marketplace in Kericho. Discover great deals, connect with verified sellers, pay securely via M-Pesa.</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link href="/sell" className="btn-primary text-sm px-6 py-2.5">Start Selling</Link>
              <Link href="/services" className="btn-outline text-sm px-6 py-2.5">Browse Services</Link>
            </div>
          </div>

          {/* SEARCH BAR */}
          <form className="max-w-2xl mx-auto mb-6" method="get">
            <div className="bg-white rounded-[32px] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] border border-[rgba(0,0,0,0.06)] flex items-center px-4 py-2 gap-3">
              <svg className="w-5 h-5 text-[#6a6a6a] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input name="q" placeholder="Search electronics, furniture, vehicles..." className="flex-1 bg-transparent outline-none text-sm text-[#222222] placeholder:text-[#8f8f8f]" />
              <button type="submit" className="bg-[#ff385c] text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-[#e00b41] transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" /></svg>
              </button>
            </div>
          </form>

          {/* CATEGORY PILLS */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Link href="/" className="badge text-xs badge-accent">All</Link>
            {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className="badge text-xs">{c.name}</Link>)}
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941", label: "M-Pesa", sub: "Secure Payments" },
              { icon: "M9 12L11 14L15 10M12 3L4 7V12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12V7L12 3Z", label: "Escrow", sub: "Buyer Protection" },
              { icon: "M14 16V6a2 2 0 00-2-2H4a2 2 0 00-2 2v10M15 16H9M19 16h1a2 2 0 002-2v-4a2 2 0 00-2-2h-3", label: "Delivery", sub: "Kericho & Beyond" },
              { icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z", label: "Local", sub: "Verified Sellers" },
            ].map((s, i) => (
              <div key={i} className="airbnb-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-[rgba(255,56,92,0.06)]">
                  <svg className="w-5 h-5 text-[#ff385c]" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#222222]">{s.label}</p>
                <p className="text-[11px] text-[#6a6a6a] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <ListingsSection />
    </div>
  );
}
