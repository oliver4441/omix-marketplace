import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import ListingsSection from "./ListingsSection";

export default function HomePage() {
  return (
    <div>
      <section className="pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4" style={{ background: "rgba(255,56,92,0.08)", border: "1px solid rgba(255,56,92,0.15)" }}>
              <span className="w-2 h-2 rounded-full bg-[#ff385c]" />
              <span className="text-[#ff385c] text-xs font-medium">Trusted marketplace in Kenya</span>
            </div>
            <h1 className="text-2xl md:text-5xl font-bold leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>
              Buy & Sell.<br />
              <span className="text-[#ff385c]">Simple & Secure.</span>
            </h1>
            <p className="mt-2 text-xs md:text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              The leading P2P marketplace in Kericho. Discover great deals, connect with verified sellers, pay securely via M-Pesa.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Link href="/sell" className="btn-primary text-xs md:text-sm px-4 py-2">Start Selling</Link>
              <Link href="/services" className="btn-outline text-xs md:text-sm px-4 py-2">Browse Services</Link>
            </div>
          </div>

          <form className="max-w-2xl mx-auto mb-5" method="get">
            <div className="flex items-center px-3 py-2 gap-2 md:px-4 md:py-2 rounded-full" style={{ background: "var(--bg-card)", boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)", border: "1px solid var(--border)" }}>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input name="q" placeholder="Search electronics, furniture..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }} />
              <button type="submit" className="bg-[#ff385c] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#e00b41] flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" /></svg>
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            <Link href="/" className="badge text-[11px] badge-accent">All</Link>
            {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className="badge text-[11px]">{c.name}</Link>)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 max-w-3xl mx-auto">
            {[
              { label: "M-Pesa", sub: "Secure Payments" },
              { label: "Escrow", sub: "Buyer Protection" },
              { label: "Delivery", sub: "Kericho & Beyond" },
              { label: "Local", sub: "Verified Sellers" },
            ].map((s, i) => (
              <div key={i} className="airbnb-card p-3 md:p-4 text-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl mx-auto mb-1.5 md:mb-2 flex items-center justify-center" style={{ background: "rgba(255,56,92,0.08)" }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-[#ff385c]" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs md:text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.label}</p>
                <p className="text-[10px] md:text-[11px]" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ListingsSection />
    </div>
  );
}
// Cache bust: 1780554710
