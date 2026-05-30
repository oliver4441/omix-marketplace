import Link from "next/link";
import { formatPrice } from "@/lib/constants";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  images: string[] | null;
}

export default function ProductCard({
  id,
  title,
  price,
  condition,
  location,
  images,
}: ProductCardProps) {
  return (
    <Link href={`/listings/${id}`}>
      <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-square bg-gray-100 relative">
          {images?.[0] ? (
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              📦
            </div>
          )}
          <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-1 rounded-full">
            {condition === "like_new"
              ? "Like New"
              : condition === "good"
              ? "Good"
              : condition === "fair"
              ? "Fair"
              : condition}
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {title}
          </h3>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            {formatPrice(price)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{location}</p>
        </div>
      </div>
    </Link>
  );
}
