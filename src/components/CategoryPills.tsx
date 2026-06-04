"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = ["All", "Electronics", "Furniture", "Clothing", "Services", "Vehicles", "Home & Garden", "Books", "Sports", "Health & Beauty", "Others"];

export default function CategoryPills({ activeCategory }: { activeCategory?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = activeCategory || "All";

  function handleClick(cat: string) {
    const url = new URL(window.location.href);
    if (cat === "All") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", cat);
    }
    url.searchParams.delete("q");
    router.push(url.pathname + url.search);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: "none" }}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleClick(cat)}
          className={current === cat ? "pill pill-active" : "pill"}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
