"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ImageUploader from "@/components/ImageUploader";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

export default function SellPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [listingId, setListingId] = useState<string | null>(null);

  async function handleCreateListing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPublishing(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/login");
        return;
      }

      const price = Math.round(parseFloat(formData.get("price") as string) * 100);
      const { data: listing, error: dbError } = await supabase
        .from("listings")
        .insert({
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          price,
          condition: formData.get("condition") as string,
          location_city: formData.get("location") as string,
          location_region: "Kericho",
          category_id: parseInt(formData.get("category_id") as string),
          is_negotiable: formData.get("is_negotiable") === "on",
          status: "active",
          seller_id: userData.user.id,
        })
        .select("id")
        .single();

      if (dbError || !listing) {
        setError(dbError?.message || "Failed to create listing");
        setPublishing(false);
        return;
      }

      setListingId(listing.id);

      if (uploadedFiles.length > 0) {
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(
            `${listing.id}/${Date.now()}_cover.${uploadedFiles[0].name.split(".").pop()}`,
            uploadedFiles[0],
            { cacheControl: "3600", contentType: uploadedFiles[0].type }
          );

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("listing-images")
            .getPublicUrl(
              `${listing.id}/${Date.now()}_cover.${uploadedFiles[0].name.split(".").pop()}`
            );

          await supabase.from("listing_images").insert({
            listing_id: listing.id,
            image_url: urlData.publicUrl,
            is_primary: true,
            sort_order: 0,
          });
        }

        for (let i = 1; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const path = `${listing.id}/${Date.now()}_${i}.${file.name.split(".").pop()}`;
          const { error: err } = await supabase.storage
            .from("listing-images")
            .upload(path, file, { cacheControl: "3600", contentType: file.type });

          if (!err) {
            const { data: urlData } = supabase.storage
              .from("listing-images")
              .getPublicUrl(path);

            await supabase.from("listing_images").insert({
              listing_id: listing.id,
              image_url: urlData.publicUrl,
              is_primary: false,
              sort_order: i,
            });
          }
        }
      }

      router.push(`/listings/${listing.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPublishing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-500"}`}>
          1
        </div>
        <div className={`flex-1 h-1 rounded ${step >= 2 ? "bg-emerald-600" : "bg-white/10"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-500"}`}>
          2
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-white">
        {step === 1 ? "List an Item for Sale" : "Add Photos"}
      </h1>
      <p className="text-slate-400 mb-6">
        {step === 1
          ? "Tell us about what you're selling"
          : "Great! Now add some photos to attract buyers"}
      </p>

      <form onSubmit={handleCreateListing} className="space-y-4">
        {step === 1 && (
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
              <input
                name="title"
                required
                maxLength={120}
                placeholder="e.g., iPhone 12 Pro 128GB - Excellent Condition"
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                name="description"
                rows={5}
                placeholder="Describe your item — condition, specs, reason for selling..."
                className="glass-input resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Price (KES) *</label>
                <input
                  name="price"
                  type="number"
                  required
                  min="1"
                  placeholder="5000"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Condition *</label>
                <select
                  name="condition"
                  required
                  defaultValue="good"
                  className="glass-input"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                <select
                  name="category_id"
                  required
                  className="glass-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Location *</label>
                <input
                  name="location"
                  required
                  placeholder="e.g., Kericho Town"
                  className="glass-input"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" name="is_negotiable" defaultChecked className="rounded accent-emerald-500" />
                Price is negotiable
              </label>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 glass-btn rounded-xl font-medium"
            >
              Continue to Photos
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="glass-card p-6 space-y-4">
            <ImageUploader
              maxImages={5}
              maxSizeMB={5}
              onImagesChange={(files) => setUploadedFiles(files)}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 glass-btn-outline rounded-xl font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="flex-1 py-3 glass-btn rounded-xl font-medium disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish Listing"}
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              By listing, you agree to Marketplace terms. Listing fee: free.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
