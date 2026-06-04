function Footer() {
  return (
    <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; 2026 Omix Store. Kericho, Kenya. by <a href="https://omixsystems.store" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff385c]">omixsystems.store</a>
        </p>
        <div className="flex gap-4">
          <a href="about.html" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">About</a>
          <a href="sell.html" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">Sell</a>
        </div>
      </div>
    </footer>
  );
}