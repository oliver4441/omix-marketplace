"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createListing } from "@/lib/actions/listings";

const CATEGORIES = ["Electronics", "Furniture", "Clothing", "Services", "Vehicles", "Home & Garden", "Books", "Sports", "Health & Beauty", "Others"];
const LOCATIONS = ["CBD", "Litein", "Kapsoit", "Brooke", "Sosiot", "Kaitet", "Awasi", "Kipchimchim", "Chepseon"];
const CONDITIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair", "N/A (Services)"];

export default function SellPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createListing(formData);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Post a listing</h1>
        <p className="mb-8" style={{ color: "var(--text-muted)" }}>No account needed. Just fill the details and post.</p>

        {error && (
          <div className="p-4 rounded-lg mb-6 text-sm" style={{ background: "rgba(255,56,92,0.1)", color: "#ff385c" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Title</label>
            <input required name="title" type="text" placeholder="e.g. iPhone 12 Pro" className="input" style={{ background: "var(--bg-secondary)" }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Price (KES)</label>
              <input required name="price" type="number" placeholder="0" className="input" style={{ background: "var(--bg-secondary)" }} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Condition</label>
              <select required name="condition" className="input appearance-none" style={{ background: "var(--bg-secondary)" }}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Category</label>
              <select required name="category" className="input appearance-none" style={{ background: "var(--bg-secondary)" }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Location</label>
              <select required name="location" className="input appearance-none" style={{ background: "var(--bg-secondary)" }}>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Description</label>
            <textarea required name="description" rows={4} placeholder="Describe your item..." className="input resize-none" style={{ background: "var(--bg-secondary)" }} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Image URL</label>
            <input name="image_url" type="url" placeholder="https://unsplash.com/..." className="input" style={{ background: "var(--bg-secondary)" }} />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Paste an image URL from Unsplash, Pexels, or anywhere online.</p>
          </div>

          <div className="border-t pt-6 mt-6" style={{ borderColor: "var(--border-light)" }}>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Your Name</label>
            <input required name="seller_name" type="text" placeholder="e.g. Kiprono" className="input" style={{ background: "var(--bg-secondary)" }} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Phone (optional)</label>
            <input name="seller_phone" type="tel" placeholder="+254 700 000 000" className="input" style={{ background: "var(--bg-secondary)" }} />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 mt-8 text-base">
            {submitting ? "Posting..." : "Post Listing"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
