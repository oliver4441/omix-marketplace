class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack); }
  render() {
    if (this.state.hasError) return <div className="p-8 text-center text-red-500">Something went wrong.</div>;
    return this.props.children;
  }
}

function App() {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredListings = MOCK_LISTINGS.filter(listing => {
    const matchesCategory = activeCategory === 'All' || listing.category === activeCategory;
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col" data-name="app" data-file="app.js">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#ff385c]/10 via-zinc-100 to-white dark:from-[#ff385c]/10 dark:via-zinc-900 dark:to-zinc-950 py-16 px-4 mb-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">Buy and sell in Kericho</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-xl mx-auto text-lg">The cleanest marketplace to find electronics, furniture, vehicles, and services near you.</p>
            
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <div className="icon-search text-zinc-400 group-focus-within:text-[#ff385c] transition-colors"></div>
              </div>
              <input 
                type="text" 
                placeholder="Search for anything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-[#ff385c]/50 text-zinc-900 dark:text-white shadow-xl transition-all"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-[14px] text-sm font-medium whitespace-nowrap border ${
                  activeCategory === cat 
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' 
                    : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {filteredListings.map(listing => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500 dark:text-zinc-400">
              No listings found for your search.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);