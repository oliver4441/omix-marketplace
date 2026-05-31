import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#047857",
};

export const metadata: Metadata = {
  title: "Omix Marketplace — Buy & Sell in Kericho",
  description: "The trusted second-hand marketplace for Kericho, Kenya",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Omix",
  },
  icons: {
    icon: "/favicon.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Omix Marketplace",
    description: "Buy & Sell in Kericho — The trusted P2P marketplace",
    type: "website",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/jpeg" href="/favicon.jpg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <meta name="theme-color" content="#047857" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* PWA Install Banner — client component */}
        <PWABanner />
        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[PWA] Service Worker registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.log('[PWA] SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

// =============================================
// PWA Banner (client component inline)
// =============================================
function PWABanner() {
  // This is rendered inline to avoid extra chunk
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            if (window.matchMedia('(display-mode: standalone)').matches) return;
            
            var deferredPrompt;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              deferredPrompt = e;
              
              // Create install banner
              var banner = document.createElement('div');
              banner.id = 'pwa-banner';
              banner.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:9999;max-width:400px;margin:0 auto;background:#047857;color:white;border-radius:16px;padding:16px;box-shadow:0 10px 40px rgba(0,0,0,0.2);font-family:system-ui,sans-serif;animation:slideUp 0.3s ease;';
              banner.innerHTML = '<div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📱</div><div><p style="font-weight:600;font-size:14px;margin:0;">Install Omix</p><p style="font-size:12px;margin:2px 0 0;opacity:0.8;">Add to home screen for faster access</p></div></div><div style="display:flex;gap:8px;margin-top:12px;"><button id="pwa-install-btn" style="flex:1;padding:8px;background:white;color:#047857;border-radius:8px;border:none;font-weight:600;font-size:13px;cursor:pointer;">Install Now</button><button id="pwa-dismiss-btn" style="padding:8px 12px;background:transparent;color:rgba(255,255,255,0.8);border:none;font-size:13px;cursor:pointer;">Later</button></div>';
              document.body.appendChild(banner);
              
              document.getElementById('pwa-install-btn').addEventListener('click', function() {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function(result) {
                  if (result.outcome === 'accepted') {
                    banner.style.display = 'none';
                  }
                  deferredPrompt = null;
                });
              });
              
              document.getElementById('pwa-dismiss-btn').addEventListener('click', function() {
                banner.style.display = 'none';
              });
            });
            
            window.addEventListener('appinstalled', function() {
              var b = document.getElementById('pwa-banner');
              if (b) b.style.display = 'none';
            });
          })();
          
          // Inject animation
          var style = document.createElement('style');
          style.textContent = '@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}';
          document.head.appendChild(style);
        `,
      }}
    />
  );
}
