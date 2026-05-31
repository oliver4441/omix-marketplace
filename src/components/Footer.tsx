import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <p className="font-bold text-white text-lg">Omix</p>
            <p className="text-sm mt-1">The trusted P2P marketplace for Kericho, Kenya</p>
            <p className="text-xs mt-3 text-gray-500">
              Buy &amp; sell with confidence. Secure payments, verified sellers.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">Marketplace</p>
            <div className="space-y-2 text-sm">
              <Link href="/" className="block hover:text-white transition">Browse Listings</Link>
              <Link href="/sell" className="block hover:text-white transition">Sell an Item</Link>
              <Link href="/services" className="block hover:text-white transition">Services</Link>
              <Link href="/ai-assistant" className="block hover:text-white transition">AI Assistant</Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">Account</p>
            <div className="space-y-2 text-sm">
              <Link href="/auth/register" className="block hover:text-white transition">Sign Up</Link>
              <Link href="/auth/login" className="block hover:text-white transition">Sign In</Link>
              <Link href="/dashboard" className="block hover:text-white transition">Dashboard</Link>
              <Link href="/messages" className="block hover:text-white transition">Messages</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">Contact</p>
            <div className="space-y-2 text-sm">
              <a href="tel:+254768213649" className="block hover:text-white transition">
                📱 0768 213 649
              </a>
              <span className="block">📍 Kericho, Kenya</span>
              <a
                href="mailto:omixsystems@gmail.com"
                className="block hover:text-white transition"
              >
                ✉️ omixsystems@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs">
          <p>© {new Date().getFullYear()} Omix Marketplace. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            Made with ❤️ in Kericho
          </p>
        </div>
      </div>
    </footer>
  );
}
