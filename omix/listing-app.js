class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { if (this.state.hasError) return <div>Error loading listing.</div>; return this.props.children; }
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const listing = MOCK_LISTINGS.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Listing not found</h2>
            <a href="index.html" className="text-[#ff385c]">Go back home</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedListings = MOCK_LISTINGS.filter(l => l.category === listing.category && l.id !== listing.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col" data-name="listing-app">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Images Left */}
          <div className="w-full md:w-1/2 lg:w-3/5">
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] overflow-hidden aspect-[4/3]">
              <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Details Right */}
          <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col">
            <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">{listing.title}</h1>
            <p className="text-3xl font-bold text-[#ff385c] mb-6">{formatKES(listing.price)}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <div className="icon-map-pin"></div>
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <div className="icon-badge"></div>
                <span>{listing.condition}</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
              <h3 className="font-bold mb-2">Description</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
              <h3 className="font-bold mb-2">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold">
                  {listing.sellerName.charAt(0)}
                </div>
                <span>{listing.sellerName}</span>
              </div>
            </div>

            {/* M-Pesa Section */}
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] p-6 mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-[14px] flex items-center justify-center text-white">
                  <div className="icon-smartphone text-2xl"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Pay via M-Pesa</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Secure direct payment</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-[8px] mb-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Buy Goods Till Number</p>
                <p className="text-2xl font-bold tracking-wider text-green-600 dark:text-green-500">1919000</p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contact the seller after payment to arrange delivery or pickup. Do not pay in advance for unseen items.
              </p>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        {relatedListings.length > 0 && (
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Similar in {listing.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedListings.map(l => (
                <ProductCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);