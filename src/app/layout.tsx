import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Omix Marketplace — Buy & Sell in Kericho",
  description: "The trusted second-hand marketplace for Kericho, Kenya",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
