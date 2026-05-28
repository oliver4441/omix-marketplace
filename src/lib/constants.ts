export const CATEGORIES = [
  { id: 1, name: "Electronics", slug: "electronics", icon: "📱" },
  { id: 2, name: "Furniture", slug: "furniture", icon: "🪑" },
  { id: 3, name: "Clothing", slug: "clothing", icon: "👕" },
  { id: 4, name: "Books", slug: "books", icon: "📚" },
  { id: 5, name: "Vehicles", slug: "vehicles", icon: "🚗" },
  { id: 6, name: "Home & Garden", slug: "home-garden", icon: "🏡" },
  { id: 7, name: "Sports", slug: "sports", icon: "⚽" },
  { id: 8, name: "Toys & Games", slug: "toys-games", icon: "🎮" },
  { id: 9, name: "Others", slug: "others", icon: "📦" },
];

export const CONDITIONS = [
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export const DELIVERY_ZONES = [
  { id: 1, name: "CBD / Town Center", fee: 150 },
  { id: 2, name: "Nearby Estates", fee: 250 },
  { id: 3, name: "Outer Areas", fee: 400 },
];

export const TILL_NUMBER = "1919000";
export const TILL_NAME = "Omix Marketplace";
export const COMMISSION_RATE = 0.07;

export function formatPrice(cents: number): string {
  return `KES ${(cents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
