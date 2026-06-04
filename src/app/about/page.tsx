import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>About Omix</h1>

        <div className="space-y-8" style={{ color: "var(--text-secondary)" }}>
          <section>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>What is Omix?</h2>
            <p className="leading-relaxed">
              Omix Marketplace is a clean, no-nonsense platform designed specifically for the Kericho community.
              We believe local commerce should not be complicated by forced accounts, heavy applications, or confusing interfaces.
              Omix gives you precisely what you need: a place to list items and a way to find them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>How it works</h2>
            <ul className="space-y-3" style={{ color: "var(--text-secondary)" }}>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "#ff385c" }}>Buyers:</span>
                <span>Browse or search for items in your area. Contact the seller directly and arrange payment via secure M-Pesa Till.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "#ff385c" }}>Sellers:</span>
                <span>Click &apos;Sell&apos;, fill in your item details, and your listing is live instantly. No accounts required.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0" style={{ color: "#ff385c" }}>Safety:</span>
                <span>We advocate for face-to-face exchanges for goods. Our M-Pesa integration ensures safe business till transactions rather than personal number transfers.</span>
              </li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Contact</h2>
            <p className="mb-4" style={{ color: "var(--text-secondary)" }}>Need help or want to report a listing? Reach out.</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:hello@omix.co.ke" className="font-medium" style={{ color: "#ff385c" }}>hello@omix.co.ke</a>
              </div>
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+254 700 000 000</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
