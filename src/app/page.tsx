import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import Link from "next/link";
import ListingsSection from "./ListingsSection";

/* ===== INLINE ICONS ===== */
const Icon = ({ d, size = "w-4 h-4", round }: { d: string; size?: string; round?: boolean }) => {
  const sizeMap: Record<string, number> = { 'w-3 h-3': 12, 'w-4 h-4': 16, 'w-5 h-5': 20, 'w-6 h-6': 24, 'w-7 h-7': 28 };
  const wh = sizeMap[size] || 16;
  return (
    <svg className={size} width={wh} height={wh} fill="none" stroke="currentColor" strokeWidth={round ? 2 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
};

const SearchIcon = () => <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" size="w-4 h-4" round />;

/* ===== STAT CARDS ===== */
const statCards = [
  { icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941", label: "M-Pesa", sub: "Secure Payments", c: "emerald" },
  { icon: "M9 12L11 14L15 10M12 3L4 7V12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12V7L12 3Z", label: "Escrow", sub: "Buyer Protection", c: "blue" },
  { icon: "M14 16V6a2 2 0 00-2-2H4a2 2 0 00-2 2v10M15 16H9M19 16h1a2 2 0 002-2v-4a2 2 0 00-2-2h-3", label: "Delivery", sub: "Kericho & Beyond", c: "purple" },
  { icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z", label: "Local", sub: "Verified Sellers", c: "amber" },
];

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400",
  blue: "bg-blue-500/10 text-blue-400",
  purple: "bg-purple-500/10 text-purple-400",
  amber: "bg-amber-500/10 text-amber-400",
};

/* ===== MAIN PAGE (SERVER COMPONENT) ===== */
export default function HomePage() {
  return (
    <div className="page-enter">
      {/* HERO */}
      <div className="hero-bg relative overflow-hidden">
        {/* Live particles - rendered via inline style, no JS needed for initial render */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full opacity-[0.06]" style={{ width: '4px', height: '4px', background: '#10b981', left: '10%', bottom: '-2%', animation: 'particleFloat 22s linear infinite', animationDelay: '0s' }} />
          <div className="absolute rounded-full opacity-[0.08]" style={{ width: '3px', height: '3px', background: '#3b82f6', left: '25%', bottom: '-2%', animation: 'particleFloat 28s linear infinite', animationDelay: '3s' }} />
          <div className="absolute rounded-full opacity-[0.05]" style={{ width: '5px', height: '5px', background: '#8b5cf6', left: '40%', bottom: '-2%', animation: 'particleFloat 35s linear infinite', animationDelay: '7s' }} />
          <div className="absolute rounded-full opacity-[0.07]" style={{ width: '3px', height: '3px', background: '#10b981', left: '55%', bottom: '-2%', animation: 'particleFloat 25s linear infinite', animationDelay: '12s' }} />
          <div className="absolute rounded-full opacity-[0.06]" style={{ width: '4px', height: '4px', background: '#3b82f6', left: '70%', bottom: '-2%', animation: 'particleFloat 30s linear infinite', animationDelay: '5s' }} />
          <div className="absolute rounded-full opacity-[0.04]" style={{ width: '3px', height: '3px', background: '#8b5cf6', left: '85%', bottom: '-2%', animation: 'particleFloat 26s linear infinite', animationDelay: '18s' }} />
          <div className="absolute rounded-full opacity-[0.08]" style={{ width: '4px', height: '4px', background: '#10b981', left: '15%', bottom: '-2%', animation: 'particleFloat 32s linear infinite', animationDelay: '9s' }} />
          <div className="absolute rounded-full opacity-[0.05]" style={{ width: '5px', height: '5px', background: '#3b82f6', left: '60%', bottom: '-2%', animation: 'particleFloat 20s linear infinite', animationDelay: '15s' }} />
          <div className="absolute rounded-full opacity-[0.06]" style={{ width: '3px', height: '3px', background: '#8b5cf6', left: '35%', bottom: '-2%', animation: 'particleFloat 27s linear infinite', animationDelay: '2s' }} />
          <div className="absolute rounded-full opacity-[0.07]" style={{ width: '4px', height: '4px', background: '#10b981', left: '90%', bottom: '-2%', animation: 'particleFloat 24s linear infinite', animationDelay: '20s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-10 pb-12 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
              <span className="text-emerald-400 text-xs font-medium">Trusted marketplace in Kenya</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Buy & Sell.<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">Simple & Secure.</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm md:text-base max-w-xl mx-auto">The leading P2P marketplace in Kericho. Discover great deals, connect with verified sellers, pay securely via M-Pesa.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/sell" className="glass-btn text-sm px-6 py-2.5">Start Selling</Link>
              <Link href="/services" className="glass-btn-outline text-sm px-6 py-2.5">Browse Services</Link>
            </div>
          </div>

          <form className="max-w-2xl mx-auto mb-8" method="get">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></div>
                <input name="q" placeholder="Search electronics, furniture, vehicles..." className="glass-input pl-10 h-12" />
              </div>
              <button type="submit" className="glass-btn h-12 px-5"><SearchIcon /><span className="hidden sm:inline">Search</span></button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Link href="/" className="badge text-xs badge-accent">All</Link>
            {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className="badge text-xs">{c.name}</Link>)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {statCards.map((s, i) => (
              <div key={i} className="glass-card p-4 text-center hover:scale-[1.02] transition-transform">
                <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${colorMap[s.c]}`}>
                  <Icon d={s.icon} size="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LISTINGS - rendered by client component */}
      <ListingsSection />
    </div>
  );
}
