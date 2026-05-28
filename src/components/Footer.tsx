export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-semibold text-white text-lg">Omix Marketplace</p>
        <p className="text-sm mt-1">
          The trusted marketplace for Kericho, Kenya
        </p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <span>📱 0768 213 649</span>
          <span>📍 Kericho, Kenya</span>
        </div>
        <p className="text-xs mt-4">
          © {new Date().getFullYear()} Omix Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
