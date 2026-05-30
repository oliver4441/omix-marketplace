import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { createListing } from "@/lib/actions/products";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">List an Item for Sale</h1>
      <p className="text-gray-500 mb-6">Reach thousands of buyers in Kericho</p>
      <form
        action={createListing}
        encType="multipart/form-data"
        className="space-y-4 bg-white p-6 rounded-xl border"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="e.g., iPhone 12 Pro 128GB - Excellent Condition"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={5}
            placeholder="Describe your item — condition, specs, reason for selling..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
            <input
              name="price"
              type="number"
              required
              min="1"
              placeholder="5000"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
            <select
              name="condition"
              required
              defaultValue="good"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category_id"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              name="location"
              required
              placeholder="e.g., Kericho Town"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_negotiable" defaultChecked className="rounded" />
            Price is negotiable
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
          <input
            name="photos"
            type="file"
            multiple
            accept="image/*"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-400 mt-1">Upload up to 5 photos. First photo is the cover.</p>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
        >
          Publish Listing
        </button>
        <p className="text-xs text-gray-400 text-center">
          By listing, you agree to Omix Marketplace terms. Listing fee: free.
        </p>
      </form>
    </div>
  );
}
