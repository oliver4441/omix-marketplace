import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-airbnb py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="font-bold text-[var(--text-primary)] text-lg">Omix</p>
            <p className="text-sm mt-2 text-[var(--text-secondary)]">The trusted P2P marketplace for Kericho, Kenya</p>
            <p className="text-xs mt-3 text-[var(--text-secondary)]">Buy and sell with confidence. Secure payments via M-Pesa. Verified sellers.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm mb-3">Marketplace</p>
            <div className="space-y-2.5 text-sm">
              <Link href="/" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Browse Listings</Link>
              <Link href="/sell" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Sell an Item</Link>
              <Link href="/services" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Services</Link>
              <Link href="/ai-assistant" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">AI Assistant</Link>
            </div>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm mb-3">Account</p>
            <div className="space-y-2.5 text-sm">
              <Link href="/auth/register" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Sign Up</Link>
              <Link href="/auth/login" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Sign In</Link>
              <Link href="/dashboard" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Dashboard</Link>
              <Link href="/messages" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Messages</Link>
            </div>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm mb-3">Contact</p>
            <div className="space-y-2.5 text-sm">
              <a href="tel:+254768213649" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                0768 213 649
              </a>
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Kericho, Kenya
              </span>
              <a href="mailto:omixsystems@gmail.com" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg className="w-4 h-4" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                omixsystems@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--text-secondary)]">
          <p>© 2026 Omix Marketplace. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Built in Kericho, Kenya</p>
        </div>
      </div>
    </footer>
  );
}
