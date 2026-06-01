import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0f1a",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
