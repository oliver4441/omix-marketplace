function Navbar() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="index.html" className="text-2xl font-bold text-[#ff385c] tracking-tight">Omix Store</a>
        
        <div className="flex items-center gap-4">
          <a href="about.html" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors duration-200">About</a>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors duration-200" aria-label="Toggle theme">
            <div className="icon-moon text-xl hidden dark:block"></div>
            <div className="icon-sun text-xl block dark:hidden"></div>
          </button>
          <a href="sell.html" className="bg-[#ff385c] text-white px-4 py-2 rounded-[14px] text-sm font-bold hover:bg-[#e03150] transition-colors duration-200">
            Sell
          </a>
        </div>
      </div>
    </nav>
  );
}