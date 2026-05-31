"use client";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  label?: string;
}

const sizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export default function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
  showValue = false,
  reviewCount,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= Math.round(rating);
    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onChange?.(i)}
        className={`${sizeMap[size]} ${
          interactive
            ? "cursor-pointer hover:scale-110 transition-transform focus:outline-none"
            : "cursor-default"
        } ${filled ? "text-amber-400" : "text-gray-300"}`}
        aria-label={interactive ? `Rate ${i} star${i > 1 ? "s" : ""}` : undefined}
      >
        ★
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showValue && rating > 0 && (
        <span className={`ml-1 font-medium ${sizeMap[size]} text-gray-700`}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={`ml-1 ${sizeMap[size]} text-gray-500`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// =============================================
// StarRatingInput — For review submission forms
// =============================================
export function StarRatingInput({
  value,
  onChange,
  label = "Your Rating",
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        className={`text-3xl transition-all hover:scale-115 focus:outline-none ${
          i <= value ? "text-amber-400" : "text-gray-300 hover:text-amber-200"
        }`}
      >
        ★
      </button>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1">{stars}</div>
    </div>
  );
}

// =============================================
// RatingDistribution — For seller profile / store
// =============================================
export function RatingDistribution({
  ratings,
  total,
}: {
  ratings: { stars: number; count: number }[];
  total: number;
}) {
  const sorted = [...ratings].sort((a, b) => b.stars - a.stars);
  const maxCount = Math.max(...ratings.map((r) => r.count), 1);

  return (
    <div className="space-y-1.5">
      {sorted.map((r) => (
        <div key={r.stars} className="flex items-center gap-2 text-sm">
          <span className="w-12 text-gray-600">{r.stars} star</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${(r.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-gray-500 text-xs">{r.count}</span>
        </div>
      ))}
      {total > 0 && (
        <p className="text-xs text-gray-400 pt-1">Based on {total} review{total !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
