class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { if (this.state.hasError) return <div>Error</div>; return this.props.children; }
}

function App() {
  return (
    <div className="min-h-screen flex flex-col" data-name="about-app">
      <Navbar />
      
      <main className="flex-grow max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-bold mb-6 text-zinc-900 dark:text-white">About Omix</h1>
        
        <div className="space-y-8 text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">What is Omix?</h2>
            <p className="leading-relaxed">
              Omix Marketplace v2 is a clean, no-nonsense platform designed specifically for the Kericho community. 
              We believe local commerce shouldn't be complicated by forced accounts, heavy applications, or confusing interfaces. 
              Omix gives you precisely what you need: a place to list items and a way to find them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">How it works</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Buyers:</strong> Browse or search for items in your area. Contact the seller directly and arrange payment via secure M-Pesa Till.</li>
              <li><strong>Sellers:</strong> Click 'Sell', fill in your item details, and your listing is live instantly. No accounts required.</li>
              <li><strong>Safety:</strong> We advocate for face-to-face exchanges for goods. Our M-Pesa integration ensures safe business till transactions rather than personal number transfers.</li>
            </ul>
          </section>

          <section className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-[14px]">
            <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Contact Us</h2>
            <p className="mb-4">Need help or want to report a listing? Reach out to our local team.</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="icon-mail text-zinc-400"></div>
                <a href="mailto:hello@omix.co.ke" className="text-[#ff385c] font-medium">hello@omix.co.ke</a>
              </div>
              <div className="flex items-center gap-2">
                <div className="icon-phone text-zinc-400"></div>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);