export default function Footer() {
  return (
    <footer className="footer py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          &copy; 2026 Omix Marketplace. Kericho, Kenya.
        </p>
        <div className="flex gap-4">
          <a href="/about" className="text-sm" style={{ color: "var(--text-muted)" }}>About</a>
          <a href="/sell" className="text-sm" style={{ color: "var(--text-muted)" }}>Sell</a>
        </div>
      </div>
    </footer>
  );
}
